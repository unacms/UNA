import { NavBottomTabs } from 'app/components/navBottomTabs'
import { CurrentUserProvider } from 'app/context/user';
export default function Root (props) {
  return (
    <CurrentUserProvider>
       <NavBottomTabs initial = 'home'/>
    </CurrentUserProvider>
  );
}

