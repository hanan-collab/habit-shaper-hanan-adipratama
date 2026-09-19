import{fireEvent,render,screen}from'@testing-library/react';
import{expect,test,vi}from'vitest';
import{RelapseDialog}from'./RelapseDialog';

test('submits the optional relapse reason after trimming it',()=>{
  const confirm=vi.fn();
  render(<RelapseDialog habitName="No late soda" pending={false} onClose={()=>{}} onConfirm={confirm}/>);
  expect(screen.getByRole('dialog')).toHaveTextContent('One moment does not erase the pattern.');
  fireEvent.change(screen.getByLabelText(/What made today difficult/i),{target:{value:'  Stressful meeting  '}});
  fireEvent.click(screen.getByRole('button',{name:'Record reset'}));
  expect(confirm).toHaveBeenCalledWith('Stressful meeting');
});

test('allows a relapse report without a reason',()=>{
  const confirm=vi.fn();
  render(<RelapseDialog habitName="No late soda" pending={false} onClose={()=>{}} onConfirm={confirm}/>);
  fireEvent.click(screen.getByRole('button',{name:'Record reset'}));
  expect(confirm).toHaveBeenCalledWith(undefined);
});
