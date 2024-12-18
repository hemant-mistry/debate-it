import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

function HomePage() {

  const userEmail = useSelector((state:RootState)=>state.user.email);

  return <div>Home: {userEmail}</div>;
}

export default HomePage;
