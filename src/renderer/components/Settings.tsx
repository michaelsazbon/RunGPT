import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const [apikey, setApikey] = useState('');
  const [bingcookie, setBingcookie] = useState('');
  const [aiprovider, setAiprovider] = useState('chatgpt');
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const SaveApiKey = () => {
    setIsSaved(false);
    setIsLoaded(false);
    window.electron.store.set('apikey', apikey);
    window.electron.store.set('bingcookie', bingcookie);
    window.electron.store.set('aiprovider', aiprovider);
    setIsLoaded(true);
    setIsSaved(true);

    setTimeout(() => setIsSaved(false), 3000)
  };

  useEffect(() => {

    setIsLoaded(false);
    const key: any = window.electron.store.get('apikey');
    const aiprovider: any = window.electron.store.get('aiprovider');
    const bingcookie: any = window.electron.store.get('bingcookie');

    if(key) {
      setApikey(key);
    }
    if(aiprovider) {
      setAiprovider(aiprovider);
    }
    if(bingcookie) {
      setBingcookie(bingcookie);
    }

    setIsLoaded(true);

  }, []);

  return (
    <div className="app">
     

      <div className='d-flex flex-column align-items-center'>

      {!isLoaded && (
        <div className="spinner-border text-white m-3" role="status">
          <span className="visually-hidden">En attente des résultats...</span>
        </div>
      )}
      {isLoaded && error && (
        <div className="mt-2 p-2 alert alert-danger shadow-sm  w-100">
          {error}
        </div>
      )}
      {isLoaded && isSaved && (
        <div className="mt-2 p-2 alert alert-success shadow-sm  w-100">
          The settings has been successfuly saved
        </div>
      )}

      <Link className='btn btn-sm  btn-outline-dark' to="/">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left me-1" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
      </svg> 
      Back
      </Link> 

      <div className="my-3 card shadow-sm">
        <div className="card-body text-start">
          <h5 className="card-title mb-4 d-flex text-dark">Settings</h5>
          <div className="mt-3 mb-2 row">
                <label htmlFor="category" className="col-form-label text-dark fw-bold">
                AI Provider
                </label>
                <div className="">
                <select
                  className="form-select form-select-sm"
                  id="category"
                  name="category"
                  value={aiprovider}
                  onChange={(e) => setAiprovider(e.target.value)}
                >
                            <option value=""></option>
                            <option value="chatgpt">ChatGPT</option>
                            <option value="bingchat">BingChat</option>
                </select>
                </div>
              </div>

          {aiprovider == "chatgpt" && (
          <div className="mt-3 mb-2 row">
            <label className="col-form-label text-dark fw-bold">
            ChatGPT API Key
            </label>
            <div className="">
              <input
                value={apikey}
                onChange={(e) => setApikey(e.target.value)}
                className="form-control me-1"
              />
            </div>
            </div>
            )
          }
            
            {aiprovider == "bingchat" && (
          <div className="mt-3 mb-2 row">
            <label className="col-form-label text-dark fw-bold">
            Bing _U cookie
            </label>
            <div className="">
              <input
                value={bingcookie}
                onChange={(e) => setBingcookie(e.target.value)}
                className="form-control me-1"
              />
            </div>
            </div>
            )
          }

          <button className="btn btn-sm btn-dark w-100" onClick={SaveApiKey}>
                Save
              </button>
        </div>
      </div>
    </div>
    </div>
  );
}
