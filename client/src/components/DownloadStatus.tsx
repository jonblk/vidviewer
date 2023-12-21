import React, { useContext } from 'react';
import { truncateString } from '../util';
import GlobalContext from '../contexts/GlobalContext';
import { FaCheckCircle,  FaTimesCircle } from 'react-icons/fa';
import Spinner from './Spinner';
import useFetch from '../hooks/useFetch';

export interface iDownloadStatus {
  video_id: number;
  is_cancelled: boolean;
  is_complete: boolean;
  is_error: boolean;
  is_paused: boolean;
  title: string;
  url: string;
  progress: number;
  speed: string;
}

interface DownloadStatusProps {
  isDark: boolean;
  downloadStatuses: iDownloadStatus[];
}

const DownloadStatus: React.FC<DownloadStatusProps> = ({ downloadStatuses, isDark }) => {
  const rootURL = useContext(GlobalContext)?.rootURL;
  const { fetch: fetchResume } = useFetch('', 'PATCH',  false);
  const { fetch: fetchCancel } = useFetch('', 'DELETE', false);

  const onClickCancel = (videoID: number) => {
    fetchCancel(`${rootURL}/downloads/${videoID}`)
  }

  const onClickResume = (videoID: number) => {
    fetchResume(`${rootURL}/downloads/${videoID}`)
  }

  return (
    <div className={`h-50 w-[380px] fixed top-10 right-4 z-20 m-4 ${isDark ? "bg-neutral-700 " : "bg-neutral-100"} shadow-lg rounded`}>
    {downloadStatuses.length === 0 && <p className="text-center">No recent downloads</p>}
    {downloadStatuses.map((d, index) => (
      <div key={index} className={`${index === 0 && "rounded-t"} ${index === downloadStatuses.length-1 && "rounded-b"}  p-2 px-3 flex items-center} ${d.is_cancelled && "opacity-50"} ${d.is_error && "opacity-40"} ${d.is_complete && "opacity-60"}`}>
        <div className="flex flex-1 flex-col">
        { 
           true &&
          <div className="flex gap-1 text-sm">
            {
            !d.is_paused && <> <p> {d.is_complete ? 100 : d.progress}% </p><p className="opacity-25"> | </p> <p> {d.speed} </p></>
            }
          </div>
        }
        <p className="flex-1 text-md"> { truncateString(d.title, d.is_paused ? 28 : 31) } </p>
        </div>
        
        {
          <div className="flex items-center">
            {/* TODO - clean up state logic */ }
            {  d.progress < 98 && !d.is_complete && !d.is_cancelled && !d.is_paused && 
              <button
                className={`text-sm  flex h-6 items-center ${"rounded px-1 bg-red-500 text-white"}`}
                onClick={() => onClickCancel(d.video_id)}
              >
                Cancel
              </button>
            }
            { d.is_paused && !d.is_cancelled && !d.is_error && !d.is_complete &&
            <div className="flex gap-1 items-center">
              <button
                className={`text-sm  flex h-6 items-center ${"rounded px-1 bg-blue-600 text-white"}`}
                onClick={() => onClickResume(d.video_id)}
              >
                Resume
              </button>
              <button
                className={`text-sm  flex h-6 items-center ${"rounded px-1 bg-red-500 text-white"}`}
                onClick={() => onClickCancel(d.video_id)}
              >
                Cancel
              </button>
            </div>
            }

            { d.progress >= 98 && !d.is_error && !d.is_complete && !d.is_paused && !d.is_cancelled  && 
              <Spinner /> 
            }

            { d.is_cancelled && !d.is_error && 
              <span className="flex items-center gap-1"> cancelled </span>
            }

            { d.is_error && 
              <span className="flex items-center gap-1">
                <FaTimesCircle className="text-red-600" /> error{" "}
              </span>
            }

            { d.is_complete && !d.is_error && 
              <span className="flex items-center gap-1">
                <FaCheckCircle className="text-green-500 text-sm" /> done
              </span>
            }
          </div>
          }
        </div>
     ))}
   </div>
 );
};

export default DownloadStatus;