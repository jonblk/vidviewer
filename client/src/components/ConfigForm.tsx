import { useState, useEffect, useContext } from "react";
import Input from "./Input";
import Button from "./Button";
import Label from "./Label";
import GlobalContext from "../contexts/GlobalContext";

interface FormComponentProps {
  onSuccess: () => void
}

type Config = {
  folder_path: string
}

const ConfigForm: React.FC<FormComponentProps> = ({ onSuccess }) => {
  const [rootFolderPath, setRootFolderPath] = useState<string>("");
  const [error, setError] = useState<string | null>()
  const rootURL = useContext(GlobalContext)?.rootURL 

  useEffect(() => {
    const get = async () => {
      try {
        const response = await fetch(`${rootURL}/config`, {method: "GET"})
        const json = await response.json() as Config
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
      const response = await fetch(`${rootURL}/config`, {
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
      <div className="mb-4 ">
        <Label htmlFor="title">Root Folder</Label>
        <p className=" text-red-500"> {error}</p>
        <div className="flex flex-col gap-1">
        <Input
          type="input"
          value={rootFolderPath}
          label="root folder path"
          id="root_folder_path"
          onChange={(event) => setRootFolderPath(event.target.value)}
        />
        <Button color="neutral" type="submit" onClick={handleSubmit}>
          Update Root
        </Button>
</div>
      </div>
      
        
    </form>
  );
};

export default ConfigForm;