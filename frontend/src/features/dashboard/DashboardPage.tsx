import{useMemo,useState}from'react';
import{useMutation,useQuery,useQueryClient}from'@tanstack/react-query';
import{Link}from'react-router';
import{AnimatedList,NumberTicker,Particles}from'../../components/magicui';
import{HabitIcon}from'../../components/ui/HabitIcon';
import{CircularProgress,LinearProgress}from'../../components/ui/Progress';
import{UserAvatar}from'../../components/ui/UserAvatar';
import{localDate}from'../../lib/api';
import type{GamificationEvent}from'../../types/domain';
import{useSession}from'../auth/auth.queries';
import{EventResponse}from'../gamification/EventResponse';
import{habitsApi}from'../habits/habits.api';
import{RelapseDialog}from'../habits/RelapseDialog';
import{dashboardApi}from'./dashboard.api';
import styles from'./DashboardPage.module.css';

export const dashboardKey=['dashboard']as const;
type Action={id:string;action:'complete'|'undo'|'relapse'|'undo-relapse';note?:string};
const resolvedToday=(status:string)=>status==='COMPLETED'||status==='RELAPSED';

export function DashboardPage(){
  const cache=useQueryClient();
  const session=useSession();
  const query=useQuery({queryKey:dashboardKey,queryFn:dashboardApi.get});
  const[events,setEvents]=useState<GamificationEvent[]>([]);
  const[relapseId,setRelapseId]=useState<string|null>(null);
  const[burstHabitId,setBurstHabitId]=useState<string|null>(null);
  const mutation=useMutation({
    mutationFn:async(input:Action)=>{
      const date=localDate(session.data?.user.timezone);
      if(input.action==='undo')return habitsApi.removeCompletion(input.id,date);
      if(input.action==='undo-relapse')return habitsApi.removeRelapse(input.id,date);
      if(input.action==='relapse')return habitsApi.relapse(input.id,date,input.note)as Promise<{meta:{gamificationEvents:GamificationEvent[]}}>;
      return habitsApi.complete(input.id,date)as Promise<{meta:{gamificationEvents:GamificationEvent[]}}>;
    },
    onSuccess:(result,input)=>{
      if(result&&'meta'in result){
        setEvents(result.meta.gamificationEvents);
        if(input.action==='complete'&&result.meta.gamificationEvents.length){
          setBurstHabitId(input.id);
          window.setTimeout(()=>setBurstHabitId(current=>current===input.id?null:current),900);
        }
      }
      setRelapseId(null);
      void cache.invalidateQueries({queryKey:dashboardKey});
    },
  });

  const dashboard=query.data?.dashboard;
  const habits=useMemo(()=>[...(dashboard?.habits??[])].sort((a,b)=>Number(resolvedToday(a.todayStatus))-Number(resolvedToday(b.todayStatus))),[dashboard?.habits]);
  if(query.isLoading)return <div className="stack"><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/></div>;
  if(query.isError||!dashboard)return <div className="panel"><h2>We couldn't load today.</h2><p>Your progress has not changed.</p><button className="raisedSecondary" onClick={()=>query.refetch()}>Retry</button></div>;

  const completed=dashboard.habits.filter(habit=>habit.todayStatus==='COMPLETED'||habit.todayStatus==='CLEAN').length;
  const rate=dashboard.habits.length?completed/dashboard.habits.length*100:0;
  const relapseHabit=dashboard.habits.find(habit=>habit.id===relapseId);
  const dateLabel=new Intl.DateTimeFormat('en',{dateStyle:'full',timeZone:session.data?.user.timezone}).format(new Date());

  return <>
    <header className={styles.productBar}>
      <div><span className={styles.stepMark}><i/><i/><i/></span><span><b>Today</b><small>{dateLabel}</small></span></div>
      {session.data?.user&&<UserAvatar seed={session.data.user.id||session.data.user.email}/>}
    </header>

    <section className={styles.momentum}>
      <div><span className={styles.kicker}>YOUR MOMENTUM</span><div className={styles.summaryLine}><strong><NumberTicker value={dashboard.userStatistics.bestOverallStreak}/></strong><span>DAYS<br/>MOVING.</span></div><p>{completed} of {dashboard.habits.length} habits shaped for today.</p></div>
      <CircularProgress value={rate} label="today"/>
    </section>

    {habits.length===0?<section className={styles.empty}><img src="/brand/patterns/step-grid.svg" alt=""/><h1>Start with one thing.</h1><p>Your first habit turns today into something visible.</p><Link className="raisedPrimary" to="/app/habits/new">Create first habit</Link></section>:<section className={styles.today}>
      <div className={styles.sectionTitle}><div><p className="eyebrow">Today's habits</p><h1>One relevant action.</h1></div><Link to="/app/habits">View all</Link></div>
      <AnimatedList className={styles.habits}>{habits.map(habit=>{
        const resolved=resolvedToday(habit.todayStatus);
        return <article key={habit.id} className={`${styles.habit} ${resolved?styles.resolved:''}`}>
          {burstHabitId===habit.id&&<Particles burstKey={habit.id}/>}
          <div className={styles.habitTop}><HabitIcon seed={habit.id}/><Link to={`/app/habits/${habit.id}`}><small>{habit.type} · DAILY</small><h2>{habit.name}</h2></Link><div className={styles.streak}><strong><NumberTicker value={habit.statistics.currentStreak}/></strong><span>{habit.type==='BUILD'?'DAY STREAK':'DAYS CLEAR'}</span></div></div>
          {habit.type==='BUILD'?<div className={styles.actions}>{habit.todayStatus==='COMPLETED'?<><span className={styles.doneState}>✓ COMPLETED TODAY</span><button className="plainButton" disabled={mutation.isPending} onClick={()=>mutation.mutate({id:habit.id,action:'undo'})}>Undo</button></>:<button className={styles.completeButton} disabled={mutation.isPending&&mutation.variables?.id===habit.id} onClick={()=>mutation.mutate({id:habit.id,action:'complete'})}>{mutation.isPending&&mutation.variables?.id===habit.id?'Saving…':'Complete today'}</button>}</div>:<div className={styles.actions}>{habit.todayStatus==='RELAPSED'?<><span className={styles.resetState}>RESET RECORDED · PROGRESS STILL COUNTS</span><button className="plainButton" disabled={mutation.isPending} onClick={()=>mutation.mutate({id:habit.id,action:'undo-relapse'})}>Correct record</button></>:<><span className={styles.cleanState}>CLEAN TODAY · NO ACTION NEEDED</span><button className="plainButton" onClick={()=>setRelapseId(habit.id)}>Report relapse</button></>}</div>}
        </article>;
      })}</AnimatedList>
    </section>}

    <section className={styles.support}>
      <article className={styles.statsPanel}><p className="eyebrow">Visible progress</p><div className={styles.stats}><div><strong><NumberTicker value={dashboard.userStatistics.bestOverallStreak}/></strong><span>personal best</span></div><div><strong><NumberTicker value={dashboard.userStatistics.totalBuildCompletions}/></strong><span>steps completed</span></div><div><strong><NumberTicker value={dashboard.userStatistics.totalGoalsCompleted}/></strong><span>goals shaped</span></div></div></article>
      <article className={styles.goalsPanel}><p className="eyebrow">Active finish lines</p>{dashboard.goals.length?<div className={styles.goalList}>{dashboard.goals.map(goal=><Link key={goal.id} className={styles.goal} to={`/app/goals/${goal.id}`}><img src="/brand/icons/goal.svg" alt=""/><div><small>GOAL · {goal.targetStreakDays} DAYS</small><h3>{goal.title}</h3><LinearProgress value={goal.progress.currentStreak} max={goal.targetStreakDays} label={`${goal.progress.remainingDays} days remaining`}/></div></Link>)}</div>:<><h3>A finish line is optional.</h3><p>Build the pattern first, then add a goal when it helps.</p><Link className={styles.goalCta} to="/app/goals/new">Create a goal →</Link></>}</article>
    </section>

    {mutation.isError&&<div className={styles.error} role="alert">We couldn't save that action. Your streak has not changed. Try again.</div>}
    {relapseHabit&&<RelapseDialog habitName={relapseHabit.name} pending={mutation.isPending} onClose={()=>setRelapseId(null)} onConfirm={note=>mutation.mutate({id:relapseHabit.id,action:'relapse',note})}/>}
    <EventResponse events={events} onDismiss={()=>setEvents([])}/>
  </>;
}
