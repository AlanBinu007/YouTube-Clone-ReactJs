import React, {useState, useEffect} from 'react';
import "./SearchPage.css";
import TuneIcon from '@material-ui/icons/Tune';
import ChannelRow from './../ChannelRow/ChannelRow';
import VideoRow from './../VideoRow/VideoRow';
import {useParams} from 'react-router';
import axios from 'axios';
import {DateTime} from 'luxon';
import { Link } from 'react-router-dom';
import CircularProgress from '@material-ui/core/CircularProgress';
import Alert from '@material-ui/lab/Alert';


const SearchPage = (props) => {
    let { searchQuery } = useParams();
    
    const [channelRow, setChannelRow] = useState('');
    const [videoRows, setVideoRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
      setChannelRow('');
      setVideoRows([]);
      axios
        .get(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=channel&q=${searchQuery}&safeSearch=none&key=${process.env.REACT_APP_YOUTUBE_API_KEY}`)
        .then(response => {
          createChannelRow(response.data['items'][0]);
        })
        

        axios
        .get(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=9&type=video&q=${searchQuery}&safeSearch=none&key=${process.env.REACT_APP_YOUTUBE_API_KEY}`)
        .then(response => {
          createVideoRows(response.data['items']);
          setIsError(false);
        })
        .catch(error => {
          console.log(error);
          setIsError(true);
          setIsLoading(false);
        })

    }, [searchQuery])


    async function createChannelRow(channel) {
      const channelId = channel.id.channelId;
      const response = await axios
                              .get(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${process.env.REACT_APP_YOUTUBE_API_KEY}`)
      const noOfVideos = response.data.items[0].statistics.videoCount;
      const subs = response.data.items[0].statistics.subscriberCount;
      const snippet = channel.snippet;
      const title = snippet.title;
      const description = snippet.description;
      const image = snippet.thumbnails.medium.url;
      setChannelRow({
        channelId,
        image,
        title,
        subs,
        noOfVideos,
        description
      });
    }

    async function createVideoRows(videos) {
      let newVideoRows = [];
      for (const video of videos) {
        const videoId = video.id.videoId;
        const response = await axios
                                .get(`https://www.googleapis.com/youtube/v3/videos?part=statistics%2C%20snippet&id=${videoId}&key=${process.env.REACT_APP_YOUTUBE_API_KEY}`)
        const views = response.data.items[0].statistics.viewCount;
        const snippet = video.snippet;
        const title = snippet.title;
        const timestamp = DateTime.fromISO(snippet.publishedAt).toRelative();
        const channel = snippet.channelTitle;
        const description = snippet.description;
        const image = snippet.thumbnails.medium.url;
                            
        newVideoRows.push({
          videoId,
          title,
          image,
          views,
          timestamp,
          channel, 
          description
        });
      };
      setVideoRows(newVideoRows);
      setIsLoading(false);
    }
    if (isError) {
      return <Alert severity="error" className='loading'>No Results found!</Alert>
    }
    return (
        <div className="searchpage">
            <div className="searchpage__filter">
                <TuneIcon />
                <h2>Filter</h2>
            </div>
            { isLoading ? <CircularProgress className='loading' color='secondary' /> : null }
            <hr />
            { !isLoading ? <ChannelRow 
                                  key={channelRow.channelId}
                                  image={channelRow.image}
                                  channel={channelRow.title}
                                  subs={channelRow.subs}
                                  noOfVideos={channelRow.noOfVideos}
                                  description={channelRow.description}
                            /> : null
            }
            <hr />
            {
              videoRows.map(item => {
                return (
                        <Link key={item.videoId} to={`/video/${item.videoId}`}>
                          <VideoRow
                            title={item.title}
                            image={item.image}
                            views={item.views}
                            timestamp={item.timestamp}
                            channel={item.channel}
                            description={item.description}
                          />
                        </Link>
                )
              })
              
            }   
            
        </div>
    )
}

export default SearchPage;
