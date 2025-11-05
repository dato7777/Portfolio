import { useEffect, useState } from "react";

const About=() =>{
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/about")
      .then(res => res.json())
      .then(data => setInfo(data));
  }, []);

  if (!info) return <div>Loading...</div>;

  return (
    <div>
      <h1>{info.name}</h1>
      <h2>{info.title}</h2>
      <p>{info.summary}</p>
      <p>📍 {info.location}</p>
      <h3>Skills:</h3>
      <ul>
        {info.skills.map(skill => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </div>
  );
}

export default About;
