import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GPTTask, Category, GPTTaskParameter, GPTTaskExecution } from '../models/GPTTask';
import icon from '../../../assets/icon.png';
import taskicon from '../../../assets/tasks.png';


export default function Home() {

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isParamFormOpen, setIsParamFormOpen] = useState(false);
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(true);
  const [copySuccess2, setCopySuccess2] = useState('');
  const [schedule, setSchedule] = useState('');
  const [scheduleLabel, setScheduleLabel] = useState('');
  

  const [GPTTasks, setGPTTasks] = useState<GPTTask[]>([])

  const [GPTTask, setGPTTask] = useState<GPTTask>({});


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

  const truncateString = (str: string, num: number) :string => {
    // If the length of str is less than or equal to num
    // just return str--don't truncate it.
    if (str.length <= num) {
      return str
    }
    // Return str truncated with '...' concatenated to the end of str.
    return str.slice(0, num) + '...'
  }


  const filteredGPTTasks = GPTTasks.filter(GPTTask =>
    GPTTask.name.toLowerCase().trim().indexOf(searchTerm.toLowerCase().trim()) > -1
  );


  const handleScheduleParamInputChange = (event: React.FormEvent<HTMLFormElement>) => {
    const { name, value } = event.target;

    if(name == "EveryMinute") {
      setSchedule("0 */"+value+" * ? * *")
      setScheduleLabel("Every "+value+" min")
    }
  }

  const handleExecutionParamInputChange = (event: React.FormEvent<HTMLFormElement>) => {
    const { name, value } = event.target;

    const newGPTTasksExecutions: any[] = [...GPTTask.executions]
    var index = newGPTTasksExecutions[GPTTask.executions.length - 1].parameters.findIndex((t: { name: any; }) => t.name === name);
    const newGPTTasksParameters: any[] = [...newGPTTasksExecutions[GPTTask.executions.length - 1].parameters]
    newGPTTasksParameters[index].value = value


    setGPTTask((prevProps) => ({
      ...prevProps,
      executions: newGPTTasksExecutions
    }));

  };

  
  

  const ScheduleTaskForm = (gptTask: GPTTask) => {

    setGPTTask(gptTask);


    setIsScheduleFormOpen(true)
  }

  const ScheduleTask = async (event: React.FormEvent<HTMLFormElement>) => {


    var execution:GPTTaskExecution = {
      id: genUniqueId(),
      parameters: GPTTask.parameters.map(p =>  { return {name: p.name, type: p.type, options: p.options , value: p.default, required: p.required}}),
      code_execution_result: ""
    }

    //setGPTTaskExecution(execution)

    //GPTTask.executions.push(execution)

    const newGPTTasksExecs = [...GPTTask.executions];
    newGPTTasksExecs.push(execution);

    setGPTTask((prevProps) => ({
      ...prevProps,
      schedule: schedule,
      schedule_label: scheduleLabel,
      executions: newGPTTasksExecs
    }));

    window.electron.ipcRenderer.sendMessage('schedule-task', [GPTTask.language, GPTTask.code, GPTTask.id, GPTTask.executions[GPTTask.executions.length - 1].parameters, GPTTask.modules, GPTTask.schedule]);


    setIsScheduleFormOpen(false)
  }

  const startExecuteCode = (gptTask: GPTTask) => {
    //event.preventDefault();

    setGPTTask(gptTask);

    var execution:GPTTaskExecution = {
      id: genUniqueId(),
      parameters: gptTask.parameters.map(p =>  { return {name: p.name, type: p.type, options: p.options , value: p.default, required: p.required}}),
      code_execution_result: ""
    }

    //setGPTTaskExecution(execution)

    //GPTTask.executions.push(execution)

    const newGPTTasksExecs = [...gptTask.executions];
    newGPTTasksExecs.push(execution);

    setGPTTask((prevProps) => ({
      ...prevProps,
      executions: newGPTTasksExecs
    }));

    setIsParamFormOpen(true)

  }

  const executeCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    //console.log(result)
    setError('');
    setIsLoaded(false);
    setIsParamFormOpen(false)

    setGPTTask(prevState => {
      const lastExecutionIndex = prevState.executions.length - 1;
      const lastExecution = prevState.executions[lastExecutionIndex];
      const updatedLastExecution = {
        ...lastExecution,
        start_date: new Date()
      };
      const updatedExecutions = [
        ...prevState.executions.slice(0, lastExecutionIndex),
        updatedLastExecution
      ];
      return {
        ...prevState,
        executions: updatedExecutions
      };
    });

    //window.electron.store.set('result', GPTTask.code);
    window.electron.ipcRenderer.sendMessage('chatgpt-result', [GPTTask.language, GPTTask.code, GPTTask.id, GPTTask.executions[GPTTask.executions.length - 1].parameters, GPTTask.modules]);
  }


  const handleEditClick = (GPTTask: GPTTask) => {
    navigate("/gpttask", { state: { id: GPTTask.id } })
    //setCurrentGPTTask(GPTTask);
    //setIsEditFormOpen(true);
  };

  const handleDeleteClick = (GPTTask: GPTTask) => {
    // TODO: implement deletion logic
    if (window.confirm(`Are you sure to delete the GPT Task : "${GPTTask.name}"?`)) {

      const index = GPTTasks.findIndex(
        (conn) => conn.id === GPTTask?.id
      );
      if (index !== -1) {
        const newGPTTasks = [...GPTTasks];
        newGPTTasks.splice(index, 1)
        setGPTTasks(newGPTTasks);

        window.electron.store.set('GPTTasks', newGPTTasks);
      }


    }
  };

  window.electron.ipcRenderer.once('chatgpt-result', (arg: any) => {
    // eslint-disable-next-line no-console
    console.log(arg);
    setIsLoaded(true);

    if(arg.success) {
      //setExecutionResult(arg.result);

      setGPTTask(prevState => {
        const lastExecutionIndex = prevState.executions.length - 1;
        const lastExecution = prevState.executions[lastExecutionIndex];
        const updatedLastExecution = {
          ...lastExecution,
          code_execution_result: arg.result,
          end_date: new Date(),
          status: "succes"
        };
        const updatedExecutions = [
          ...prevState.executions.slice(0, lastExecutionIndex),
          updatedLastExecution
        ];
        return {
          ...prevState,
          executions: updatedExecutions
        };
      });
      //GPTTask.code_execution_result = arg.result;
      //GPTTask.executions[GPTTask.executions.length - 1].code_execution_result = arg.result;

      // const newGPTTasksExecutions: any[] = [...GPTTask.executions]
      // var index = newGPTTasksExecutions[GPTTask.executions.length - 1].parameters.findIndex((t: { name: any; }) => t.name === name);
      // const newGPTTasksParameters: any[] = [...newGPTTasksExecutions[GPTTask.executions.length - 1].parameters]
      // newGPTTasksParameters[index].value = value


      // setGPTTask((prevProps) => ({
      //   ...prevProps,
      //   executions: newGPTTasksExecutions
      // }));

      //saveGPTTask();
      //window.electron.store.set('executionResult', arg.result);
    } else {
      setError(arg.error)

      setGPTTask(prevState => {
        const lastExecutionIndex = prevState.executions.length - 1;
        const lastExecution = prevState.executions[lastExecutionIndex];
        const updatedLastExecution = {
          ...lastExecution,
          code_execution_result: arg.result,
          end_date: new Date(),
          status: "failed"
        };
        const updatedExecutions = [
          ...prevState.executions.slice(0, lastExecutionIndex),
          updatedLastExecution
        ];
        return {
          ...prevState,
          executions: updatedExecutions
        };
      });
      //window.electron.store.set('executionResult', null);
    }

  });

  const copyToClipboard = (text:string, type : number) => {
    navigator.clipboard.writeText(text);
    if(type == 2) {
      setCopySuccess2('Copied!');
      setTimeout(() => setCopySuccess2(''), 2000)
    }
  }


  useEffect(() => {

    window.electron.ipcRenderer.once('schedule-task-execution', (arg: any) => {

      console.log("Rentre dans Once : " + new Date().toString())
  
      setGPTTask(prevState => {
        const lastExecutionIndex = prevState.executions.length - 1;
        const lastExecution = prevState.executions[lastExecutionIndex];
        const updatedLastExecution = {
          ...lastExecution,
          start_date: arg.start_date,
          code_execution_result: arg.result,
          end_date: new Date(),
          status: "succes"
        };
        const updatedExecutions = [
          ...prevState.executions.slice(0, lastExecutionIndex),
          updatedLastExecution,
          {
            id: genUniqueId(),
            parameters: lastExecution.parameters,
            code_execution_result: ""
          }
        ];
        return {
          ...prevState,
          executions: updatedExecutions
        };
      });
  
  
    })

    setGPTTasks(window.electron.store.get('GPTTasks') || []);

    if(GPTTask.id) {
      console.log("rentre")

      setGPTTasks((prevGPTTasks) => {
        const index = prevGPTTasks.findIndex(
          (conn) => conn.id === GPTTask?.id
        );
        if (index === -1) {
          // GPTTask not found
          return prevGPTTasks;
        }
        const newGPTTasks: any[] = [...prevGPTTasks];

        // if(executionResult != "" && GPTTask.executions && GPTTask.executions.length > 0) {
        //     GPTTask.executions[GPTTask.executions.length - 1].code_execution_result = executionResult
        // }

        newGPTTasks[index] = GPTTask;
        window.electron.store.set('GPTTasks', newGPTTasks);
        return newGPTTasks;
      });

    }

  }, [GPTTask]);

  return (
    <div className="app">
    <div className='d-flex flex-column align-items-center mx-2 my-3'>

        <div className="Hello">
          <img width="64" alt="icon" src={icon} />
        </div>
        <div className="text-center">
          <span className="h1 text-primary"> GPT </span> <span className="h1"> Tasks</span>
        </div>

      <div className='d-flex align-items-center'>

        <input
          type="text"
          className="shadow-sm  border rounded  py-2 px-3"
          placeholder="Search"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

      <Link className='btn btn-dark py-1 px-3 ms-2  shadow-sm ' to="/gpttask">
        Create GPT Task
      </Link>

      </div>

      { !isLoaded &&
          <div className='d-flex justify-content-center align-items-center'>
              <div className="spinner-border text-white m-3 " role="status">
                  <span className="visually-hidden">En attente des résultats...</span>
              </div>
          </div>
          }

      {isLoaded && error &&
              <div className="mt-2 p-2 alert alert-danger shadow-sm  w-100">{error}</div>
        }

      {isLoaded && GPTTask && GPTTask.executions && GPTTask.executions.length > 0 && GPTTask.executions[GPTTask.executions.length - 1].code_execution_result &&
            <div className="w-100 my-1">
              <label  className="form-label text-white fw-bold mb-1">
                      Output
              </label>
              <div className="d-flex mt-1 mb-2 p-2 border rounded shadow-sm bg-white text-secondary w-100 d-flex flex-column position-relative">
                    <div className="position-absolute text-success  btn-copy-code">
                      {copySuccess2}
                      <button className="btn btn-secondary btn-sm ms-1" onClick={() => copyToClipboard(GPTTask.executions[GPTTask.executions.length - 1].code_execution_result, 2)}>Copy</button>
                    </div>

                    <div className="p-2 bg-white text-secondary  w-100" dangerouslySetInnerHTML={{__html: GPTTask.executions[GPTTask.executions.length - 1].code_execution_result}}></div>
                </div>

                {/* <button className="btn btn-primary p-1 my-2 shadow-sm  w-100"  onClick={handleCreateFormSubmit}>Save GPT Task</button> */}

            </div>
        }

      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3 mt-3">
        {filteredGPTTasks.map(GPTTasks => (
          <div className={"col " + (filteredGPTTasks.length == 1 ? " cardwidth2" : "")} key={GPTTasks.id}>
            <div className="card shadow-sm ">
              <img src={GPTTasks.logo ? GPTTasks.logo : taskicon} className="card-img-top img-card" alt={GPTTasks.name} />
              <div className="card-body">
                <h5 className="card-title">{GPTTasks.name}</h5>
                <p className="card-text homecardheight">
                {GPTTasks.category != 0 && (<span className="d-block"><i className="bi bi-tag "></i> {GPTTasks.category} </span>)}
                {GPTTasks.schedule_label && (<span className="d-block"><i className="bi bi-clock "></i> {GPTTasks.schedule_label}</span>)}
                </p>
                <div className='row g-1 border-top pt-3 '>

                <button className="col-sm btn btn-primary btn-sm  mx-1" onClick={() => handleEditClick(GPTTasks)}>
                <i className="bi bi-pencil-square me-1"></i>
                  Edit
                </button>
                <button className="col-sm btn btn-success btn-sm  mx-1" onClick={() => startExecuteCode(GPTTasks)}>
                <i className="bi bi-play-fill me-1"></i>
                  Run
                </button>
                <button className="col-sm btn btn-secondary btn-sm  mx-1" onClick={() => ScheduleTaskForm(GPTTasks)}>
                <i className="bi bi-clock me-1"></i>
                  Schedule
                </button>
                <button className="col-sm btn btn-danger btn-sm mx-1" onClick={() => handleDeleteClick(GPTTasks)}>
                <i className="bi bi-x-circle me-1"></i>
                  Delete
                </button>

                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {isScheduleFormOpen && (
       <div className="modal d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setIsScheduleFormOpen(false)}>
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
            <form onSubmit={ScheduleTask}>
            <div className="modal-header">
              <h5 className="modal-title">Select Time</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsScheduleFormOpen(false)}></button>
            </div>
            <div className="modal-body">

            <div className="form-check">
              <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1" />
              <label className="form-check-label" htmlFor="flexRadioDefault1">
                Default radio
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input d-inline-block" type="radio" name="flexRadioDefault" id="flexRadioDefault2" checked />
              <label className="form-check-label d-inline-block me-1" htmlFor="flexRadioDefault2">
                Every
              </label>
              <input
              type="text"
              className="form-control d-inline-block time-schedule me-1"
              id="EveryMinute"
              name="EveryMinute"
              value={GPTTask.schedule_value}
              onChange={handleScheduleParamInputChange}
              />
              minutes
            </div>

            {/* {GPTTask.executions[GPTTask.executions.length - 1].parameters.map((param, idx) => (

              <div className="mb-3" key={param.name}>
              <label htmlFor="name" className="form-label">
                {param.name}
              </label>
              {param.required && (
                <span className='text-danger'> *</span>
              )}
              {param.type == "choice" && (
              <select
                required={param.required}
                className="form-select"
                id={param.name}
                name={param.name}
                value={param.value}
                onChange={handleExecutionParamInputChange}
              >
                {param.options.map(option => (
                  <option value={option}>{option}</option>
                ))}
              </select>)}

              {param.type == "text" && (
              <input
              required={param.required}
              type="text"
              className="form-control"
              id={param.name}
              name={param.name}
              value={param.value}
              onChange={handleExecutionParamInputChange}
            />)}

              </div>

            ))} */}

            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary me-2" onClick={() => setIsScheduleFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Schedule
              </button>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}

    {isParamFormOpen && (
       <div className="modal d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setIsParamFormOpen(false)}>
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
            <form onSubmit={executeCode}>
            <div className="modal-header">
              <h5 className="modal-title">Set Parameters</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsParamFormOpen(false)}></button>
            </div>
            <div className="modal-body">

            {GPTTask.executions[GPTTask.executions.length - 1].parameters.map((param, idx) => (

              <div className="mb-3" key={param.name}>
              <label htmlFor="name" className="form-label">
                {param.name}
              </label>
              {param.required && (
                <span className='text-danger'> *</span>
              )}
              {param.type == "choice" && (
              <select
                required={param.required}
                className="form-select"
                id={param.name}
                name={param.name}
                value={param.value}
                onChange={handleExecutionParamInputChange}
              >
                {param.options.map(option => (
                  <option value={option}>{option}</option>
                ))}
              </select>)}

              {param.type == "text" && (
              <input
              required={param.required}
              type="text"
              className="form-control"
              id={param.name}
              name={param.name}
              value={param.value}
              onChange={handleExecutionParamInputChange}
            />)}

              </div>

            ))}

            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary me-2" onClick={() => setIsParamFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Execute
              </button>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

