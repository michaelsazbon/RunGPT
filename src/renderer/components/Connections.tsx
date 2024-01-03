/* eslint-disable prettier/prettier */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import icon from '../../../assets/icon.png';
import { Type, Connection } from '../models/GPTTask';




export default function Connections() {

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [currentConnection, setCurrentConnection] = useState<Connection | null>(null);

  const [connections, setConnections] = useState<Connection[]>([])

  const [connection, setConnection] = useState<Connection>({
    id:"",
    type: Type.null,
    name: "",
    host: "",
    username: "",
    password: "",
    logo: ""
  });

  const genUniqueId = () => {
    const dateStr = Date
      .now()
      .toString(36); // convert num to base 36 and stringify

    const randomStr = Math
      .random()
      .toString(36)
      .substring(2, 8); // start at index 2 to skip decimal point

    return `${dateStr}-${randomStr}`;
  }



  const filteredConnections = connections.filter(connection =>
    connection.name.toLowerCase().trim().indexOf(searchTerm.toLowerCase().trim()) > -1
  );


  const handleCreateClick = () => {
    setConnection({
        id:"",
        type: Type.null,
        name: "",
        host: "",
        username: "",
        password: "",
        logo: ""
      })
    setIsCreateFormOpen(true);
  };

  const handleEditClick = (connection: Connection) => {
    setCurrentConnection(connection);
    setIsEditFormOpen(true);
  };

  const handleDeleteClick = (connection: Connection) => {
    // TODO: implement deletion logic
    if (window.confirm(`Are you sure to delete the connection : "${connection.name}"?`)) {

      const index = connections.findIndex(
        (conn) => conn.id === connection?.id
      );
      if (index !== -1) {
        const newConnections = [...connections];
        newConnections.splice(index, 1)
        setConnections(newConnections);

        window.electron.store.set('connections', newConnections);
      }


    }
  };


  const handleCreateFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: implement create form submission
    connection.id = genUniqueId();

    const newConnections = [...connections];
    newConnections.push(connection);
    setConnections(newConnections);

    //connections.push(currentConnection)
    window.electron.store.set('connections', newConnections);
    setIsCreateFormOpen(false);
  };

  const handleEditFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConnections((prevConnections) => {
        const index = prevConnections.findIndex(
          (conn) => conn.id === currentConnection?.id
        );
        if (index === -1) {
          // Connection not found
          return prevConnections;
        }
        const newConnections = [...prevConnections];
        newConnections[index] = currentConnection;
        window.electron.store.set('connections', newConnections);
        return newConnections;
      });

    //window.electron.store.set('connections', connections);
    setIsEditFormOpen(false);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64data = reader.result?.toString();
        if(currentConnection) {
          setCurrentConnection(currentConnection => ({
            ...currentConnection,
            logo: base64data,
          }));
      } else {
        setConnection(connection => ({
          ...connection,
          logo: base64data,
        }));
      }

      };
    }
  };

  const handleInputChange = (event: React.FormEvent<HTMLFormElement>) => {
    const { name, value } = event.target;
    setConnection((prevProps) => ({
      ...prevProps,
      [name]: value
    }));
  };

  useEffect(() => {

    setConnections(window.electron.store.get('connections') || []);

  }, []);

  return (
    <div className="app">
    <div className='d-flex flex-column align-items-center mx-2 my-3'>

    <Link className='btn btn-sm  btn-outline-dark mt-3' to="/">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left me-1" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
      </svg>
      Back
      </Link>

      <div className="Hello">
          <img width="64" alt="icon" src={icon} />
        </div>
        <div className="text-center mb-2">
          <span className="h1 text-primary"> GPT </span> <span className="h1"> Connections</span>
        </div>

      <div className='d-flex align-items-center'>

        <input
          type="text"
          className="shadow-sm  border rounded  py-2 px-3"
          placeholder="Search"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

      <button className="btn btn-dark py-1 px-3 ms-2  shadow-sm " onClick={handleCreateClick}>
        Create GPT Connection
      </button>

      </div>
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3 mt-3">
        {filteredConnections.map(connection => (
          <div className={"col" + (filteredConnections.length == 1 ? " cardwidth" : "")} key={connection.id}>
            <div className="card shadow-sm ">
              <img src={connection.logo} className="card-img-top img-card" alt={connection.name} />
              <div className="card-body cardwidth">
                <h5 className="card-title">{connection.name}</h5>
                <p className="card-text ">
                {connection.type} {connection.host} <br />
                {connection.username}
                </p>
                <div className='d-flex '>

                <button className="btn btn-primary me-2" onClick={() => handleEditClick(connection)}>
                  Edit
                </button>
                <button className="btn btn-danger" onClick={() => handleDeleteClick(connection)}>
                  Delete
                </button>

                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isCreateFormOpen && (
       <div className="modal d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setIsCreateFormOpen(false)}>
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
            <form onSubmit={handleCreateFormSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Create Connection</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsCreateFormOpen(false)}></button>
            </div>
            <div className="modal-body">
            <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  Type
                </label>
                <select
                  className="form-select"
                  id="type"
                  name="type"
                  value={connection.type}
                  onChange={handleInputChange}
                >
                            <option value="RDS">RDS</option>
                            <option value="SSH">SSH</option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={connection.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="host" className="form-label">
                  Host
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="host"
                  name="host"
                  value={connection.host}
                  onChange={handleInputChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  name="username"
                  value={connection.username}
                  onChange={handleInputChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={connection.password}
                  onChange={handleInputChange}
                />
              </div>
              <div className="mb-3">
              {connection.logo && (
              <img
                    src={connection.logo}
                    alt="Logo Preview"
                    className="mt-2"
                    style={{ maxWidth: "100%", maxHeight: "10rem" }}
                />
                )}
                <label htmlFor="logo" className="form-label">
                  Logo
                </label>
                <input type="file" className="form-control" id="logo" name="logo" onChange={handleLogoChange} accept="image/*" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary me-2" onClick={() => setIsEditFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}
      {isEditFormOpen && currentConnection && (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setIsEditFormOpen(false)}>
           <div className="modal-dialog modal-dialog-centered" role="document" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
          <form onSubmit={handleEditFormSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Edit Connection</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsEditFormOpen(false)}></button>
            </div>
            <div className="modal-body">
            <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  Type
                </label>
                <select
                  className="form-select"
                  id="type"
                  name="type"
                  value={currentConnection.type}
                  onChange={e => setCurrentConnection({ ...currentConnection, type: e.target.value })}
                >
                            <option value="RDS">RDS</option>
                            <option value="SSH">SSH</option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={currentConnection.name}
                  onChange={e => setCurrentConnection({ ...currentConnection, name: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="host" className="form-label">
                  Host
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="host"
                  name="host"
                  value={currentConnection.host}
                  onChange={e => setCurrentConnection({ ...currentConnection, host: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  name="username"
                  value={currentConnection.username}
                  onChange={e => setCurrentConnection({ ...currentConnection, username: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={currentConnection.password}
                  onChange={e => setCurrentConnection({ ...currentConnection, password: e.target.value })}
                />
              </div>
              <div className="mb-3">
              {currentConnection.logo && (
              <img
                    src={currentConnection.logo}
                    alt="Logo Preview"
                    className="mt-2"
                    style={{ maxWidth: "100%", maxHeight: "10rem" }}
                />
                )}
                <label htmlFor="logo" className="form-label">
                  Logo
                </label>
                <input type="file" className="form-control" id="logo" name="logo" onChange={handleLogoChange} accept="image/*" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary me-2" onClick={() => setIsEditFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
              </div>


        </div>
      )}
    </div>
    </div>
  );
};

