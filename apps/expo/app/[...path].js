import { Redirect } from "expo-router";

const Index = () => {
  return <Redirect href="/tab4" />;
};
export default Index;

/*
import { Redirect, useRouter } from "expo-router";

const Index = () => {
  const router = useRouter();
  router.push("/tab0");

};
export default Index;*/
