import {
  Navbar,
  MobileNav,
  Typography,
  Button,
  IconButton,
  Card,
  Input,
} from "@material-tailwind/react";
import { useEffect, useState } from "react";

const Home = () => {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/")
      .then(res => res.json())
      .then(data => setInfo(data));
  }, []);

  if (!info) return <div>Loading...</div>;

  return (
    <div className="mx-auto max-w-screen-md py-12">
      <Card className="relative mb-12 h-96 overflow-hidden bg-[url('/textures/bg-pattern.svg')] bg-green-900 bg-cover bg-center text-white shadow-xl flex flex-col justify-center items-center">
  <img
    alt="nature"
    className="h-64 w-auto mx-auto rounded-lg shadow-lg"
    src="/images/dato.jpg"
  />
  <div className="absolute bottom-4 right-4 max-w-xs bg-black/60 backdrop-blur-sm p-4 rounded-lg shadow-lg text-sm text-white">
    <p className="italic leading-snug">
      "When the solution is simple, God is answering."
    </p>
    <p className="mt-2 text-right text-xs font-light tracking-wide">
      — Albert Einstein
    </p>
  </div>
</Card>

      <Typography variant="h2" color="blue-gray" className="mb-2">
        {info.page}
      </Typography>
      <Typography color="gray" className="font-normal">
        {info.content}&apos;

      </Typography>
    </div>
  );
}

export default Home;
