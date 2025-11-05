import React from 'react';
import { Button } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";

const project_list = ["QuizProAI"];

const Projects = () => {
  const navigate = useNavigate();

  const handleProjectClick = (project) => {
    // Format project name to match your route
    const path = `/projects/${project.toLowerCase()}`;
    navigate(path);
  };

  return (
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-6">PROJECTS</h1>
      <p className="mb-4 text-lg">Choose a Project :</p>

      <div className="flex flex-wrap justify-center gap-4 mt-6">
        {project_list.map((project) => (
          <Button
            key={project}
            color="white"
            size="lg"
            onClick={() => handleProjectClick(project)}
            className="bg-indigo-800 text-white text-xl font-semibold capitalize rounded-full px-6 py-3 shadow-md hover:bg-white hover:text-indigo-800 hover:shadow-xl hover:shadow-white/30 transition duration-300"
          >
            {project}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Projects;
