import App from "../src/App.tsx";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { playlistData, videoData} from "./fixtures.ts"

global.fetch = vi.fn();

const fetch = global.fetch;
const getAllPlaylistsUrl = "http://localhost:8000/playlists";

// stubbed test data
const playlists = playlistData;

// video data
const playlist_videos = videoData;

// the selected/modified playlist in the tests
const playlist = playlists[1];

const renderApp = async () => {
  // Render the component that uses fetch and updates the DOM
  render(<App />);
  // Wait for the fetch to complete and the DOM to update
  await screen.findByText(playlist.name);
}

// Test the playlist functionality with mocked server calls
describe("create new playlist", () => {
  let newPlaylistName = "Sailing"
  let fetchSpy; 

  beforeEach(async () => {
    fetchSpy = vi.spyOn(global, "fetch");

    fetchSpy
      // fetch playlists on mount 
      .mockResolvedValueOnce({ json: () => Promise.resolve(playlists) }) 
      // create playlist
      .mockResolvedValueOnce({ ok: true })
      // fetch playlists after create successful
      .mockResolvedValueOnce({ json: () => Promise.resolve(playlists.filter(p=>p.id!== playlist.id)) }) 

    await renderApp()

    // Open new playlist menu
    const element = screen.queryByTestId("new-playlist-button");
    fireEvent.click(element)
  })

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("should open new playlist form", async () => {
    const createButton = screen.queryByTestId("create-playlist-button");
    expect(createButton).toBeDefined();
  });

  it("should call POST playlists on click", async () => {
    // Set the value of the input
    const nameInput = screen.getByLabelText("Playlist name");
    fireEvent.change(nameInput, { target: { value: newPlaylistName } });

    // Click submit
    const createButton = screen.getByTestId("create-playlist-button");
    fireEvent.click(createButton);

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/playlists",
      {
        body: "{\"name\":\"Sailing\"}",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        method: "POST"
      }
    );
  });

  it("should then update the playlists list", async () => {
    // Set the value of the input
    const nameInput = screen.getByLabelText("Playlist name");
    fireEvent.change(nameInput, { target: { value: newPlaylistName } });

    // Click submit
    const createButton = screen.getByTestId("create-playlist-button");
    fireEvent.click(createButton);

    await waitFor(() => {
      const element = screen.queryByText(newPlaylistName);
      expect(element).toBeDefined();
    });
  })
});

// Test the playlist functionality with mocked server calls
describe("the App component mounts", () => {
  let fetchSpy; 

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  })

  afterEach(() => {
    fetchSpy.mockRestore();
    fetch.mockRestore();
  });

  it("should call fetch playlists", async () => {
    fetchSpy.mockReturnValue(
      Promise.resolve({ json: () => Promise.resolve(playlists) })
    );

    await renderApp()
    
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(getAllPlaylistsUrl);
  });

  it("should then update the DOM with the returned playlists data", async () => {
    fetch.mockResolvedValue({
      json: () => new Promise((resolve) => resolve(playlists)),
    });

    await renderApp()
    
    // Assert that the DOM is updated correctly
    const element = screen.getByText(playlist.name);
    expect(element).toBeDefined();
  });
});

const openEditPlaylistForm = async () => {
  // open the edit playlist modal
  const button = await screen.findByTestId(
    `edit-playlist-button-${playlist.id}`
  );
  fireEvent.click(button);
};

describe("user clicks edit playlist", () => {
  let fetchSpy;

  beforeEach(async () =>{
    fetchSpy = vi.spyOn(global, "fetch");
    fetch.mockResolvedValue({
      json: () => new Promise((resolve) => resolve(playlists)),
    });
    await renderApp()
    await openEditPlaylistForm()
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    fetch.mockRestore();
  });

  it("should open the 'edit playlist' form", () => {
    // Assert modal is open
    const modal = screen.queryByTestId("modal");
    expect(modal).toBeInTheDocument();
  });

  it("should open the 'edit playlist' form with the selected playlist", () => {
    // Assert that the modal is opened
    const nameInput = screen.getByLabelText("Playlist name");

    // Assert that the name input references the correct playlist
    expect(nameInput).toHaveValue(playlist.name);
  });
});

describe("user clicks delete playlist", () => {
  let fetchSpy;
  const path = `http://localhost:8000/playlists/${playlist.id}`;

  beforeEach(async () => {
    fetchSpy = vi.spyOn(global, "fetch");

    fetchSpy
      // fetch playlists on mount 
      .mockResolvedValueOnce({ json: () => Promise.resolve(playlists) }) 
      // delete playlist
      .mockResolvedValueOnce({ ok: true })
      // fetch playlists after delete successful
      .mockResolvedValueOnce({ json: () => Promise.resolve(playlists.filter(p=>p.id!== playlist.id)) }) 

    /*
    fetchSpy.mockImplementation((url, options) => {
      if(options && options.method === 'DELETE') {
        return new Promise(resolve => resolve({ok: true})) 
      } else {
        return new Promise(resolve => resolve({json: () => Promise.resolve(playlists)}))
      }
    }); 
    */
    await renderApp()
    await openEditPlaylistForm();

    // Activate delete menu
    const deleteButtonWarning = await screen.findByTestId("warn-delete-playlist");
    fireEvent.click(deleteButtonWarning);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    fetch.mockRestore();
  });

  it("should call delete playlist api", async () => {
    // Click delete button to create DELETE request
    const deleteButton = await screen.findByTestId("delete-playlist");
    fireEvent.click(deleteButton);

    // Note - brittle test?
    expect(fetchSpy).toHaveBeenNthCalledWith(2, path, {method: "DELETE"});
  });

  it("should update the playlists list", async () => {
    // Click delete button to create DELETE request
    const deleteButton = await screen.findByTestId("delete-playlist");
    fireEvent.click(deleteButton);
    // Wait for the DOM to update
    await waitFor(() => {
      const element = screen.queryByText(playlist.name);
      expect(element).toBeNull();
    });
  })

  it.todo("should handle server errors")
});

describe("update playlist", () => {
  let fetchSpy;
  const path = `http://localhost:8000/playlists/${playlist.id}`;
  const new_name = "Nature"
  const updated_playlists = playlists.map(p => {
    if(p.id === playlist.id) {
      return {
        id: playlist.id,
        name: new_name
      }
    } else {
      return p
    }
  })

  beforeEach(async () => {
    fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy
      // fetch playlists on mount 
      .mockResolvedValueOnce({ json: () => Promise.resolve(playlists) }) 
      // delete playlist
      .mockResolvedValueOnce({ ok: true })
      // fetch playlists after delete successful
      .mockResolvedValueOnce({ json: () => Promise.resolve(updated_playlists) }) 

    await renderApp()
    await openEditPlaylistForm();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("should update 'playlist name' input", async () => {
    // Update the name input
    const nameInput = screen.getByLabelText("Playlist name");

    // Set the value of the input
    fireEvent.change(nameInput, { target: { value: new_name } });

    // Verify that the value has been set
    expect(nameInput.value).toBe(new_name);
  });

  it("should call the UPDATE playlist api", async () => {
    // Update the name input
    const nameInput = screen.getByLabelText("Playlist name");

    // Set the value of the input
    fireEvent.change(nameInput, { target: { value: new_name } });

    // Click button to create UPDATE request
    const updateButton = await screen.findByTestId("update-playlist");
    fireEvent.click(updateButton);

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2, 
      path, 
      {
        body: "{\"name\":\"Nature\"}", 
        headers: {"Content-Type": "application/json"}, 
        method: "PUT"
      }
    );
  });

  it("should update playlist list with new name", async () => {
    // Update the name input
    const nameInput = screen.getByLabelText("Playlist name");

    // Set the value of the input
    fireEvent.change(nameInput, { target: { value: new_name } });

    // Click button to create UPDATE request
    const updateButton = screen.getByTestId("update-playlist");
    fireEvent.click(updateButton);

    await waitFor(() => {
      const element = screen.queryByText(playlist.name);
      expect(element).toBeNull();
    });

    await waitFor(() => {
      const element = screen.queryByText(new_name);
      expect(element).toBeDefined();
    });

    // check if the modal is closed
    await waitFor(() => {
      const modal = screen.queryByTestId("modal");
      expect(modal).toBeNull();
    });
  });
});

describe("user selects playlist", () => {
  let fetchSpy; 
  const path = `http://localhost:8000/playlist_videos/${playlist.id}?page=1&limit=25`

  beforeEach(async () => {
    fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy
      // fetch playlists on mount 
      .mockResolvedValueOnce({ json: () => Promise.resolve(playlists) }) 
      // fetch videos when user selects playlist
      .mockResolvedValueOnce({ json: () => Promise.resolve(playlist_videos) }) 

    await renderApp()

    const playlistItem = screen.queryByTestId(playlist.id);
    fireEvent.click(playlistItem);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    fetch.mockRestore();
  });

  it("should fetch videos when playlist selected", async () => {
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenNthCalledWith(2, path);
    })
  });

  it("should display the video grid", async () => {
    await waitFor(() => {
      const videoGridItem = screen.queryByTestId(`video-grid-item-${playlist_videos[0].id}`);
      expect(videoGridItem).toBeInTheDocument();
    })
  });
})
