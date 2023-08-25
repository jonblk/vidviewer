import { useState, useEffect } from "react";
import Input from "./Input";
import Button from "./Button";
import Label from "./Label";

interface FormComponentProps {
  onSuccess: () => Promise<void>
}

type Config = {
  folder_path: string
}

const ConfigForm: React.FC<FormComponentProps> = ({ onSuccess }) => {
  const [rootFolderPath, setRootFolderPath] = useState<string>("");
  const [error, setError] = useState<string | null>()

  useEffect(() => {
    const get = async () => {
      try {
        const response = await fetch("http://localhost:8000/config", {method: "GET"})
        const json = await response.json() as Config
        console.log(json)
        setRootFolderPath(json.folder_path)
      } catch (error) {
        console.log(error)
      }
    }
    get().catch(e=>console.log(e));
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(`http://localhost:8000/config`, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
        body: JSON.stringify({ root_folder_path: rootFolderPath }),
      });

      if (response.ok) {
        // Request was successful
        await onSuccess();
      } else {
        // Request failed
        const errorMessage = await response.text();
        setError(errorMessage)
      }
    } catch (error) {
      console.log("Error fetching");
    }
  };

  return (
    <form className="">
      <div className="mb-4">
        <Label htmlFor="title">Root Folder</Label>
        <Input
          type="input"
          value={rootFolderPath}
          label="root folder path"
          id="root_folder_path"
          onChange={(event) => setRootFolderPath(event.target.value)}
        />
        <p className=" text-red-500"> {error}</p>
      </div>
      <div className="flex flex-col gap-3">
        <Button color="primary" type="submit" onClick={handleSubmit}>
          Update
        </Button>
      </div>
    </form>
  );
};

export default ConfigForm;