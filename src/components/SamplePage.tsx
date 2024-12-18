import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

function SamplePage() {

  const userEmail = useSelector((state:RootState)=>state.user.email);

  return <div>Sample: {userEmail}</div>;
}

export default SamplePage;
