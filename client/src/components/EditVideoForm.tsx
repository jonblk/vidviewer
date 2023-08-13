
import { useState } from "react";
import Input from "./Input";
import Button from "./Button";
import Label from "./Label";

interface FormComponentProps {
  onSuccess: () => Promise<void>
  id?: number
  initialTitle?: string
}

const EditVideoForm: React.FC<FormComponentProps> = ({ onSuccess, id, initialTitle }) => {

  const [title, setName] = useState(initialTitle);
  const [pendingDelete, setPendingDelete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await fetch(`http://localhost:8000/videos/${id}`, {
        headers: {
          "Content-Type": "application/json", // or "multipart/form-data"
        },
        method: "PUT",
        body: JSON.stringify({ title }),
      })
      onSuccess().catch(e=>console.log(e));
    } catch (e) {
      console.log(e);
    }
  };

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await fetch(`http://localhost:8000/videos/${id}`, {
        method: "DELETE", 
      })
      onSuccess().catch(e=>console.log(e));
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <form className="">
      <div className="mb-4">
        <Label
          htmlFor="title"
        >
          Video title
        </Label>
        <Input
          label="title"
          type="text"
          id="title"
          value={title ? title : ""}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col  gap-3 ">
        <Button
          color="primary"
          type="submit"
          onClick={handleSubmit}
        >
          Update
        </Button>

        {!pendingDelete && <Button
          type="submit"
          color="neutral"
          onClick={() => setPendingDelete(true)}
        >
          Delete
        </Button>
        }

        { pendingDelete && 
        <>
          Delete this video? 
          <Button
          type="submit"
          color="neutral"
          onClick={() => setPendingDelete(false)}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          color="danger"
          onClick={handleDelete}
        >
          Delete '{title}'
        </Button>
        </>
        }
      </div>
    </form>
  );
};

export default EditVideoForm;