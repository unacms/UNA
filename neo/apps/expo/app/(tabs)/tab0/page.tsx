import { Screen } from 'app/components/nav/expo-screen';

/** A page pushed onto the tab's stack (`?url=`). */
export default function Page() {
  return <Screen tabname='/tab0' pushed />;
}
