import{Link}from'react-router';
import{PersonalBestChip}from'../../components/ui/PersonalBestChip';
import styles from'./LandingPage.module.css';

const steps=[
  {number:'01',label:'SET THE DIRECTION',title:'Choose the action.',text:'Build what helps or break what keeps pulling you back. Goals stay optional.'},
  {number:'02',label:'MAKE IT VISIBLE',title:'Show up today.',text:'Check in once. Habit Shaper records the day and keeps the next action obvious.'},
  {number:'03',label:'LEARN THE PATTERN',title:'See the shape form.',text:'Streaks, completion rate, and personal bests turn repetition into evidence.'},
];

function StepMark({compact=false}:{compact?:boolean}){return <span className={`${styles.stepMark} ${compact?styles.stepMarkCompact:''}`} aria-hidden="true"><i/><i/><i/></span>}

export function LandingPage(){return <div className={styles.page}>
  <nav className={styles.siteNav} aria-label="Main navigation">
    <a className={styles.brand} href="#top" aria-label="Habit Shaper home"><StepMark compact/><span>HABIT SHAPER</span></a>
    <div className={styles.navLinks}><a href="#method">How it works</a><a href="#progress">Progress</a><Link to="/brand-kit">Brand kit</Link><Link to="/login">Log in</Link></div>
    <Link className={styles.navCta} to="/register">Start shaping <span>→</span></Link>
  </nav>

  <main>
    <section className={styles.hero} id="top">
      <div className={styles.heroCopy}>
        <div className={styles.eyebrow}><span/> SMALL ACTIONS / VISIBLE PROGRESS</div>
        <h1>BUILD WHAT<br/><b>HELPS.</b></h1>
        <p>Track the actions you want to build or break. See your momentum clearly, and begin again without losing sight of how far you have come.</p>
        <div className={styles.heroActions}><Link className={styles.raisedButton} to="/register">START WITH ONE HABIT <span>→</span></Link><a href="#method">See how it works</a></div>
        <small>No perfect streaks required.</small>
      </div>

      <div className={styles.heroVisual}>
        <div className={styles.heroBackdrop} aria-hidden="true"><i/><i/><i/></div>
        <img className={styles.heroRunner} src="/images/finish-line-runner.png" alt="Happy runner crossing a finish line with both hands raised"/>
        <aside className={styles.heroProgress}><strong>18</strong><span>DAYS<br/>MOVING.</span></aside>
        <PersonalBestChip className={styles.personalBestChip}/>
      </div>
    </section>

    <section className={styles.momentumBand} aria-label="Habit Shaper promise">
      <div><span>CONSISTENCY, MADE VISIBLE.</span><span>PROGRESS, WITHOUT PUNISHMENT.</span></div>
      <div className={styles.momentumSteps} aria-hidden="true"><i/><i/><i/></div>
    </section>

    <section className={styles.methodSection} id="method">
      <header className={styles.sectionHeading}><span>THE METHOD / 03 STEPS</span><h2>DON'T CHANGE EVERYTHING.<br/>SHAPE ONE THING.</h2></header>
      <div className={styles.methodMeter}><span/><div><i>1</i><i>2</i><i>3</i></div></div>
      <div className={styles.methodSpine}>
        <div className={styles.methodRail} aria-hidden="true"><i/></div>
        {steps.map(step=><article key={step.number}><b>{step.number}</b><div><span>{step.label}</span><h3>{step.title}</h3><p>{step.text}</p></div></article>)}
      </div>
    </section>

    <div className={styles.steppedSeparator} aria-hidden="true"><i/><i/><i/></div>

    <section className={styles.recoverySection} id="progress">
      <div className={styles.recoveryCopy}><span>MOMENTUM, NOT PRESSURE</span><h2>A RESET IS DATA.<br/>NOT A VERDICT.</h2><p>Habit Shaper remembers the work that came before. Record the reset honestly and keep moving with a clearer view of your pattern.</p></div>
      <div className={styles.recoveryCard}><span>RESET RECORDED.</span><strong>YOUR PROGRESS<br/>STILL COUNTS.</strong><div><span><b>24</b><small>days shaped</small></span><span><b>6</b><small>best streak</small></span><span><b>82%</b><small>this month</small></span></div></div>
    </section>

    <section className={styles.finalCta} id="start">
      <StepMark/>
      <div><span>ONE SMALL ACTION.</span><h2>START SHAPING.</h2></div>
      <Link className={styles.raisedButton} to="/register">CREATE YOUR FIRST HABIT <span>→</span></Link>
    </section>
  </main>

  <footer className={styles.siteFooter}><a className={styles.brand} href="#top"><StepMark compact/><span>HABIT SHAPER</span></a><span>SMALL ACTIONS. VISIBLE PROGRESS.</span><span>© 2026</span></footer>
</div>}
