import useWebSocket from 'react-use-websocket';

type DownloadStatusItem = {
  id: number;
  title: string;
  percentage: string;
  file_size: string;
};

const DownloadStatus: React.FC = () => {
  const { lastMessage, readyState } = useWebSocket('ws://localhost:8000/downloads');

  if (readyState !== WebSocket.OPEN) {
    return <div>WebSocket connection is not open.</div>;
  }

   if (!lastMessage) {
    console.log("no socket messages")
    return <div></div>;
  }

    const downloadStatus: DownloadStatusItem[] = JSON.parse(lastMessage.data);

  return (
    <div className="fixed bottom-0 z-40 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-300">
    <div className="p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-4">Download Status</h2>
      {downloadStatus.length > 0 ? (
        <ul className="flex flex-col">
          {downloadStatus.map((item) => (
            <li key={item.id} className="mb-2">
              <span className="font-bold">{item.title}: </span>
              <span>{item.percentage}</span>
              <span>{item.file_size}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No download status available.</p>
      )}
    </div>
    </div>
  );
};

export default DownloadStatus;