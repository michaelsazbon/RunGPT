import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation  } from 'react-router-dom';
import icon from '../../../assets/icon.png';
import taskicon from '../../../assets/tasks.png';
import editicontask from '../../../assets/edit-icon-task.png';
import { ChatGPTCompletion } from '../services/ChatGTPApi';
import Editor from 'react-simple-code-editor';
//import { highlight, languages } from 'prismjs/components/prism-core';
import { highlight, languages } from 'prismjs';

import { ReactSearchAutocomplete } from 'react-search-autocomplete'
import { GPTTask, Category, GPTTaskParameter, GPTTaskExecution, GPTTaskExecutionParameter } from '../models/GPTTask';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from "rehype-sanitize";

import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism.css'; //Example style, you can use another


// import { PowerShell } from 'node-powershell';
declare const APP_VERSION: string;


export default function ChatGPT() {

  const location = useLocation();
  const navigate = useNavigate();
  //const [prompt, setPrompt] = useState('');
  //const [result, setResult] = useState('');
  //const [executionResult, setExecutionResult] = useState('');

  const [connection, setConnection] = useState('');
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [copySuccess2, setCopySuccess2] = useState('');
  //const [language, setLanguage] = useState('python');
  const items = window.electron.store.get('connections') || []

  const fileInputRef = useRef(null);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const [isParamFormOpen, setIsParamFormOpen] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);

  const [GPTTasks, setGPTTasks] = useState<GPTTask[]>([])

  const [GPTTask, setGPTTask] = useState<GPTTask>({
    id:"",
    category: Category.null,
    name: "",
    connection_id: "",
    prompt: "",
    code: "",
    //code_execution_result: "",
    logo: "",
    language: "python",
    parameters: [],
    executions: [],
    schedule: "",
    schedule_type: "",
    schedule_label: "",
    connections_id: [],
    schedule_value: "",
    modules: []
  });

  const [GPTTaskExecution, setGPTTaskExecution] = useState<GPTTaskExecution>();

  const version = APP_VERSION;

  const handleInputChange = (event: React.FormEvent<HTMLFormElement>) => {
    const { name, value } = event.target;

    if(name == "prompt") {
      extractParameters(value)
      extractConnections(value)
    }

    setGPTTask((prevProps) => ({
      ...prevProps,
      [name]: value
    }));

  };

  const setPrompt = (value) => {
    extractParameters(value)
    extractConnections(value)

    setGPTTask((prevProps) => ({
      ...prevProps,
      prompt: value
    }));
  }


  const handleScheduleChange = (event: React.FormEvent<HTMLFormElement>) => {
    const { name, value } = event.target;

    if(name == "EveryMinute") {
      setGPTTask((prevProps) => ({
        ...prevProps,
        schedule_type: "EveryMinute",
        schedule_value: value,
        schedule: "0 */"+value+" * ? * *",
        schedule_label: "Every "+value+" min",
      }));
    }


  };

  const EveryMinutes = () => {
    if(GPTTask.schedule) {

      if(schedule_type == "EveryMinute") {
        return schedule.substr(3, 5)
      }
    }
  }

  const handleScheduleValue = (event: React.FormEvent<HTMLFormElement>) => {
    const { name, value } = event.target;

    if(name == "EveryMinute") {
      return value;
    }


  };


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



    //var param: GPTTaskParameter = GPTTask.parameters.find((t: { name: any; }) => t.name === name);
    //param.type = value;

  };

  const handleParamInputChange = (event) => {
    let { name, value } = event.target;

    if(name.startsWith("required_")) {
      value = event.target.checked
    }

    var index = GPTTask.parameters.findIndex((t: { name: any; }) => t.name === name.replace("default_", "").replace("required_", ""));
    const newGPTTasksParameters: any[] = [...GPTTask.parameters]

    if(name.startsWith("default_")) {
      newGPTTasksParameters[index].default = value
    }
    else if(name.startsWith("required_")) {
      newGPTTasksParameters[index].required = value
    }
    else {
      newGPTTasksParameters[index].type = value
    }


    setGPTTask((prevProps) => ({
      ...prevProps,
      parameters: newGPTTasksParameters
    }));



    //var param: GPTTaskParameter = GPTTask.parameters.find((t: { name: any; }) => t.name === name);
    //param.type = value;

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

  window.electron.ipcRenderer.once('bingchat-code', (arg: any) => {
    // eslint-disable-next-line no-console
    console.log(arg);
    setIsLoaded(true);

    if(arg.success) {

      //var BingChatCode = new RegExp("```"+ GPTTask.language + "\\s([\\S\\s]+)```", "gm");

      const {code, modules} = cleanBingCode(arg.result)


      console.log(modules)
      //setExecutionResult(arg.result);
      setGPTTask((prevProps) => ({
        ...prevProps,
        code: code,
        modules: modules
      }));

      //saveGPTTask()
      //GPTTask.code = arg.result;
      //window.electron.store.set('executionResult', arg.result);
    } else {
      setError(arg.error)
      //window.electron.store.set('executionResult', null);
    }

  });

    const dateDiffToString = (a, b) => {
      let diff = Math.abs(a - b);

      let ms = diff % 1000;
      diff = (diff - ms) / 1000;
      let s = diff % 60;
      diff = (diff - s) / 60;
      let m = diff % 60;
      diff = (diff - m) / 60;
      let h = diff;

      let ss = s <= 9 && s >= 0 ? `0${s}` : s;
      let mm = m <= 9 && m >= 0 ? `0${m}` : m;
      let hh = h <= 9 && h >= 0 ? `0${h}` : h;

      return hh + ':' + mm + ':' + ss;
    };

  useEffect(() => {
    setIsLoaded(false);


    const tasks = window.electron.store.get('GPTTasks') || [];

    setGPTTasks(tasks);
    if (location.state && location.state.id) {
      var task: GPTTask = tasks.find((t: { id: any; }) => t.id === location.state.id);
      setGPTTask(task);

      if(task.connection_id) {
        var c = items.find((conn: { id: string; }) => conn.id === task.connection_id)
        if(c) {
          setConnection(c.name)
        }
      }
      

    }

    //const promptsaved: any = window.electron.store.get('prompt');
    //const resultsaved: any = window.electron.store.get('result');
    //const executionResultsaved: any = window.electron.store.get('executionResult');

    // if(promptsaved) {
    //   setPrompt(promptsaved);
    // }
    // if(resultsaved) {
    //   setResult(resultsaved);
    // }
    // if(executionResultsaved) {
    //   setExecutionResult(executionResultsaved);
    // }
    setIsLoaded(true);
  }, []);


  useEffect(() => {

    if (!(location.state && location.state.id && !GPTTask.id)) {
      saveGPTTask2(GPTTask);
    }

  }, [GPTTask]);


  const startExecuteCode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
    window.electron.ipcRenderer.sendMessage('chatgpt-result', [GPTTask.language, GPTTask.code, GPTTask.id, GPTTask.executions[GPTTask.executions.length - 1].parameters, GPTTask.modules, GPTTask.connections_id]);
  }

  const Export = () => {
    // renderer javascript file
    const content = JSON.stringify(GPTTask);
    const element = document.createElement("a");
    const file = new Blob([content], {type: "text/json"});
    element.href = URL.createObjectURL(file);
    element.download = GPTTask.name + ".json";
    element.click();
  }

  const clearAll = () => {
    setGPTTask({
      id:"",
      category: Category.null,
      name: "",
      connection_id: "",
      prompt: "",
      code: "",
      //code_execution_result: "",
      logo: "",
      language: "python",
      parameters: [],
      executions: [],
      schedule: "",
      schedule_type: "",
      schedule_label: "",
      connections_id: [],
      schedule_value: "",
      modules: []
    })
    //setError('');
    //setPrompt('');
    //setResult('');
    //setExecutionResult('');
  }

  const extractParameters = (prompt : string) => {

    var parametres = /{(\w+)}/gm;
    var ptmp = []
    var params : GPTTaskParameter[] = GPTTask.parameters || [];
    let m;

    while ((m = parametres.exec(prompt)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === parametres.lastIndex) {
        parametres.lastIndex++;
      }

      if(m.length > 1) {
        ptmp.push(m[1])
        const index = params.findIndex((p) => p.name === m[1]);
        if (index === -1) {
          params.push({name: m[1], type: "text", options: [], default: "", required: true})
        }
      }
    }

    params = params.filter( el => ptmp.includes(el.name) );

    if(prompt.match(parametres)) {
      setGPTTask((prevProps) => ({
        ...prevProps,
        parameters: params
      }));
    }
  }

  const extractConnections = (prompt : string) => {

    var connection_regex = /\[(\w+)\]/gm;
    var ptmp = []
    var connections : string[] = GPTTask.connections_id || [];
    let m;

    while ((m = connection_regex.exec(prompt)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === connection_regex.lastIndex) {
        connection_regex.lastIndex++;
      }

      if(m.length > 1) {
        var c = items.find((conn: { id: string;name: string }) => conn.name === m[1])
        if(c) {
          ptmp.push(c.name)
          const index = connections.findIndex((p) => p === c.name);
          if (index === -1) {
            connections.push(c.name)
          }
        }
      }
    }

    connections = connections.filter( el => ptmp.includes(el) );

    //if(prompt.match(connection_regex)) {
      setGPTTask((prevProps) => ({
        ...prevProps,
        connections_id: connections
      }));
    //}
  }

  const prepareCode = (prompt: string, language: string) : {instructions: string, code: string} => {

    var prompt0 = prompt;
    var instructions = "";
    instructions = 'You are an automation engineer and you need to write efficient and safe high quality code with the following instructions : \n\n';
    instructions += 'write only '+language+' code without any explanation\n';
    if(language == "python") {
     instructions += "the local machine OS is Windows 10\n"
     instructions += "use only single quote for escaping string\n"
     instructions += "use env variable to get my username\n"
     instructions += "use the Fire python module to use named parameters\n"
     instructions += "use the pandas python module to work with data\n"
     instructions += "do not give instructions on how to run the code\n"
     instructions += "if you are using non python 3 standard modules, add a line starting by a dash symbol at the top of the script with the list of modules like : \n#<modules>module1 module2</modules>\n"

    }

    prompt += '\nwrite only '+language+' code without any explanation\n';

    var parametres = /{(\w+)}/gm;
    //var params : GPTTaskParameter[] = [];
    let m;

    if(prompt.match(parametres)) {
      instructions += "declare the following paramaters which will be pass to the script as command line parameters :\n"
    }
    while ((m = parametres.exec(prompt)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === parametres.lastIndex) {
        parametres.lastIndex++;
      }

      if(m.length > 1) {
        //params.push({name: m[1], type: "text", options: [], default: "", required: true})
        var regparam = new RegExp(m[0], "g");
        prompt = prompt.replace(regparam, m[1])
        instructions += m[1] + "\n"
      }
    }


    var connections = /\[(\w+)\]/gm;
    var connection_found = []
    //var params : GPTTaskParameter[] = [];
    //let m;


    while ((m = connections.exec(prompt)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === connections.lastIndex) {
        connections.lastIndex++;
      }

      if(m.length > 1 && !connection_found.includes(m[1])) {

        instructions += "declare the 3 following parameters which will be pass to the script as command line parameters for connecting to "
        
        //params.push({name: m[1], type: "text", options: [], default: "", required: true})
        var regparam = new RegExp("\\[" + m[1] + "\\]", "g");
        connection_found.push(m[1])
        prompt = prompt.replace(regparam, m[1])
        instructions += m[1] + " :\n"
        instructions += m[1] + "_host" + "\n"
        instructions += m[1] + "_user" + "\n"
        instructions += m[1] + "_password" + "\n"
      }
    }

    // if(prompt0.match(parametres)) {
    //   setGPTTask((prevProps) => ({
    //     ...prevProps,
    //     parameters: params
    //   }));
    // }



    return {instructions, code: prompt};
  }

  const cleanCode = (code :string) : string => {
    return code.replace(/```python/g, "").replace(/```powershell/g, "").replace(/```/g, "")
  }

  const cleanBingCode = (code :string) : {code:string, modules: string[]} => {

    var bingregex = /\`\`\`python\n([\s\S][^\`\`\`]+)\`\`\`/gm
    //var bingregex = /<code>\n([\s\S]+)<\/code>/gm
    let m;
    while ((m = bingregex.exec(code)) !== null) {

      if (m.index === bingregex.lastIndex) {
        bingregex.lastIndex++;
      }

      if(m.length > 1) {
        code = m[1]
      }

    }

    var pipregex = /#<modules>(.+)<\/modules>/gm
    var modules = [];
    while ((m = pipregex.exec(code)) !== null) {

      if (m.index === pipregex.lastIndex) {
        pipregex.lastIndex++;
      }

      if(m.length > 1) {
        modules = m[1].split(" ")
      }

    }

    code = code.replace(pipregex, "")

    // var d = code.match(bingregex);
    // if (d && d.length > 1) {
    //   code = d[1];
    // }

    return {code, modules};
  }

  const complete = async () => {
    try {
      setError('');
      setIsLoaded(false);
      setGPTTask((prevProps) => ({
        ...prevProps,
        code: '',
        //code_execution_result: ''
      }));

      const aiprovider: any = window.electron.store.get('aiprovider')

      var cleaned_code = prepareCode(GPTTask.prompt, GPTTask.language)

      if(aiprovider == 'chatgpt') {

        var result = await ChatGPTCompletion(cleaned_code);
        //var result = `import os\nimport pandas as pd\nimport fire\n\ndef count_gender(file_name: str, col_name: str):\n    username = os.environ['USERNAME']\n    desktop_path = f'C:\\\\Users\\\\{username}\\\\Desktop\\\\'\n    file_path = desktop_path + file_name\n    df = pd.read_excel(file_path, sheet_name=0)\n    gender_count = df[col_name].value_counts()\n    male_count = gender_count['Male']\n    female_count = gender_count['Female']\n    table = f'''\n    <table class=\"table table-striped\">\n        <thead>\n            <tr>\n                <th>Gender</th>\n                <th>Count</th>\n            </tr>\n        </thead>\n        <tbody>\n            <tr>\n                <td>Male</td>\n                <td>{male_count}</td>\n            </tr>\n            <tr>\n                <td>Female</td>\n                <td>{female_count}</td>\n            </tr>\n        </tbody>\n    </table>\n    '''\n    print(table)\n\nif __name__ == '__main__':\n    fire.Fire(count_gender)`

        //const result = `Get-WmiObject -Class Win32_LogicalDisk | Select-Object -Property DeviceID,FreeSpace,Size,DriveType | Format-Table -AutoSize`;

        if(result !== undefined) {

          //result = cleanCode(result)
          const {code, modules} = cleanBingCode(result)
          GPTTask.code = code
          GPTTask.modules = modules

          setGPTTask(GPTTask);

          saveGPTTask()
          //setResult(result);
          //setExecutionResult('');
          //window.electron.store.set('result', result);
          //window.electron.store.set('executionResult', null);


          // let ps = new PowerShell({
          //     executableOptions: {
          //         "-ExecutionPolicy": "ByPass",
          //         "-NoProfile": true
          //     }
          // })

          // const message = 'hey from node-powershell <3';
          // const printCommand = PowerShell.command`Write-Host ${message} -ForegroundColor red -BackgroundColor white`;
          // await ps.invoke(printCommand);

        }

        setIsLoaded(true);
      } else {

          // var result = `Here is the code that meet the requirement : \n\n\`\`\`python\nimport os\nimport pandas as pd\nimport fire\n\ndef count_gender(file_name: str, col_name: str):\n    username = os.environ['USERNAME']\n    desktop_path = f'C:\\\\Users\\\\{username}\\\\Desktop\\\\'\n    file_path = desktop_path + file_name\n    df = pd.read_excel(file_path, sheet_name=0)\n    gender_count = df[col_name].value_counts()\n    male_count = gender_count['Male']\n    female_count = gender_count['Female']\n    table = f'''\n    <table class=\"table table-striped\">\n        <thead>\n            <tr>\n                <th>Gender</th>\n                <th>Count</th>\n            </tr>\n        </thead>\n        <tbody>\n            <tr>\n                <td>Male</td>\n                <td>{male_count}</td>\n            </tr>\n            <tr>\n                <td>Female</td>\n                <td>{female_count}</td>\n            </tr>\n        </tbody>\n    </table>\n    '''\n    print(table)\n\nif __name__ == '__main__':\n    fire.Fire(count_gender)\n\`\`\`\n replace thregreg reg regreg reg \nferferferfrerf`

          // result = cleanBingCode(result)

          // GPTTask.code = result

          // setGPTTask(GPTTask);

          // saveGPTTask()

          // setIsLoaded(true);

        window.electron.ipcRenderer.sendMessage('bingchat-code', [cleaned_code]);

      }


      //GPTTask.code = '';
      //GPTTask.code_execution_result = '';
      //window.electron.store.set('prompt', prompt);
      //const result = await completion(prompt);
      //const result = await ChatGPTCompletion(GPTTask.prompt, GPTTask.language);

    } catch (error: any) {
      setIsLoaded(true);
      //setResult('');
      //setExecutionResult('');
      //window.electron.store.set('result', null);
      //window.electron.store.set('executionResult', null);

      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);

        setError(error.response.data.error.message)
      } else {
        console.log(error.message);
        setError(error.message)
      }
    }
  };

  const onEnterPress = (e:any) => {
    if(e.keyCode == 13 && e.shiftKey == false) {
      e.preventDefault();
      complete();
    }
  }

  const copyToClipboard = (text:string, type : number) => {
    navigator.clipboard.writeText(text);
    if(type == 2) {
      setCopySuccess2('Copied!');
      setTimeout(() => setCopySuccess2(''), 2000)
    } else {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000)
    }
  }

  const handleOnSearch = (string: any, results: any) => {
    // onSearch will have as the first callback parameter
    // the string searched and for the second the results.
    console.log(string, results)
  }

  const handleOnHover = (result: any) => {
    // the item hovered
    console.log(result)
  }

  const handleOnSelect = (item: { id: string; }) => {
    // the item selected
    console.log(item)
    setGPTTask((prevProps) => ({
      ...prevProps,
      connection_id: item.id
    }));
    //GPTTask.connection_id = item.id
  }

  const handleOnFocus = () => {
    console.log('Focused')
  }

  const formatResult = (item: { logo: string | undefined; name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined; }) => {
    return (
      <div className='d-flex align-items-center'>
        <img style={{ maxHeight: '32px'}} src={ item.logo } />
        <span className='ms-1'>{item.name}</span>
      </div>
    )
  }

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


  const handleCreateFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: implement create form submission
    if(GPTTask.id) {

      setGPTTasks((prevGPTTasks) => {
        const index = prevGPTTasks.findIndex(
          (conn) => conn.id === GPTTask?.id
        );
        if (index === -1) {
          // GPTTask not found
          return prevGPTTasks;
        }
        const newGPTTasks: any[] = [...prevGPTTasks];
        newGPTTasks[index] = GPTTask;
        window.electron.store.set('GPTTasks', newGPTTasks);
        navigate("/");
        return newGPTTasks;
      });

    } else {

      // setGPTTasks((prevGPTTasks) => {
      //   const index = prevGPTTasks.findIndex(
      //     (conn) => conn.id === GPTTask?.id
      //   );
      //   if (index === -1) {
      //     // GPTTask not found
      //     return prevGPTTasks;
      //   }
      //   const newGPTTasks: any[] = [...prevGPTTasks];
      //   newGPTTasks[index] = GPTTask;
      //   window.electron.store.set('GPTTasks', newGPTTasks);
      //   navigate("/");
      //   return newGPTTasks;
      // });

      // setGPTTask({
      //   ...GPTTask,
      //   id: genUniqueId()
      // })
      GPTTask.id = genUniqueId();
      //GPTTask.language = language;
      //GPTTask.code = result;
      //GPTTask.prompt = prompt;
      //GPTTask.code_execution_result = executionResult;

      const newGPTTasks = [...GPTTasks];
      newGPTTasks.push(GPTTask);
      setGPTTasks(newGPTTasks);


      //GPTTaskss.push(currentGPTTask)
      window.electron.store.set('GPTTasks', newGPTTasks);
      navigate("/");
    }


  };

  const saveGPTTask = () => {
    if(GPTTask.id) {

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

    } else {

      // setGPTTasks((prevGPTTasks) => {
      //   const index = prevGPTTasks.findIndex(
      //     (conn) => conn.id === GPTTask?.id
      //   );
      //   if (index === -1) {
      //     // GPTTask not found
      //     return prevGPTTasks;
      //   }
      //   const newGPTTasks: any[] = [...prevGPTTasks];
      //   newGPTTasks[index] = GPTTask;
      //   window.electron.store.set('GPTTasks', newGPTTasks);
      //   navigate("/");
      //   return newGPTTasks;
      // });

      // setGPTTask({
      //   ...GPTTask,
      //   id: genUniqueId()
      // })
      GPTTask.id = genUniqueId();
      //GPTTask.language = language;
      //GPTTask.code = result;
      //GPTTask.prompt = prompt;
      //GPTTask.code_execution_result = executionResult;

      const newGPTTasks = [...GPTTasks];
      newGPTTasks.push(GPTTask);
      setGPTTasks(newGPTTasks);


      //GPTTaskss.push(currentGPTTask)
      window.electron.store.set('GPTTasks', newGPTTasks);
    }
  }


  const saveGPTTask2 = (Task) => {
    if(Task.id) {

      setGPTTasks((prevGPTTasks) => {
        const index = prevGPTTasks.findIndex(
          (conn) => conn.id === Task?.id
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

    } else {

      // setGPTTasks((prevGPTTasks) => {
      //   const index = prevGPTTasks.findIndex(
      //     (conn) => conn.id === GPTTask?.id
      //   );
      //   if (index === -1) {
      //     // GPTTask not found
      //     return prevGPTTasks;
      //   }
      //   const newGPTTasks: any[] = [...prevGPTTasks];
      //   newGPTTasks[index] = GPTTask;
      //   window.electron.store.set('GPTTasks', newGPTTasks);
      //   navigate("/");
      //   return newGPTTasks;
      // });

      // setGPTTask({
      //   ...GPTTask,
      //   id: genUniqueId()
      // })
      Task.id = genUniqueId();
      //GPTTask.language = language;
      //GPTTask.code = result;
      //GPTTask.prompt = prompt;
      //GPTTask.code_execution_result = executionResult;

      setGPTTasks((prevGPTTasks) => {
       
        const newGPTTasks: any[] = [...prevGPTTasks];
        newGPTTasks.push(GPTTask);

        window.electron.store.set('GPTTasks', newGPTTasks);
        return newGPTTasks;
      });


      //GPTTaskss.push(currentGPTTask)
      //window.electron.store.set('GPTTasks', newGPTTasks);
    }
  }

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: implement create form submission
    saveGPTTask()


  };

  const handleSave2 = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: implement create form submission
    // if(GPTTask.id) {

    //   setGPTTasks((prevGPTTasks) => {
    //     const index = prevGPTTasks.findIndex(
    //       (conn) => conn.id === GPTTask?.id
    //     );
    //     if (index === -1) {
    //       // GPTTask not found
    //       return prevGPTTasks;
    //     }
    //     const newGPTTasks: any[] = [...prevGPTTasks];

    //     // if(executionResult != "" && GPTTask.executions && GPTTask.executions.length > 0) {
    //     //     GPTTask.executions[GPTTask.executions.length - 1].code_execution_result = executionResult
    //     // }

    //     newGPTTasks[index] = GPTTask;
    //     window.electron.store.set('GPTTasks', newGPTTasks);
    //     navigate("/")
    //     return newGPTTasks;
    //   });

    // }

    navigate("/")


  };


  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64data = reader.result?.toString();

        setGPTTask(GPTTask => ({
            ...GPTTask,
            logo: base64data,
          }));

      };
    }
  };





  return (
    <div className="app">
      <div className="container">
      <div className="maxwidth mb-3">

      <div className='d-flex w-100 border border-light shadow-sm mt-2'>

        <button className='btn btn-outline-light rounded-0 border-0 btn-sm me-1' onClick={handleSave2}>
        <i className="bi bi-arrow-left me-1"></i>
        Back
        </button>

        <button className="btn btn-outline-light rounded-0 border-0 btn-sm me-1" onClick={clearAll}>
        <i className="bi bi-eraser me-1"></i>
          Clear
        </button>

        <button className="btn btn-outline-light rounded-0 border-0 btn-sm me-1" onClick={Export}>
        <i className="bi bi-file-earmark-arrow-down me-1"></i>
          Export
        </button>

      </div>

        <div className="Hello">
          <img width="64" alt="icon" src={icon} />
        </div>
        <div className="text-center"><span className="h1 text-primary"> Run</span><span className="h1">GPT</span> <span className="small fw-light">{version}</span></div>
        <div className="Hello d-flex flex-column ">

        {isLoaded && error &&
              <div className="mt-2 p-2 alert alert-danger shadow-sm  w-100">{error}</div>
        }

        

        {/* <button className="btn btn-dark p-1 mt-2 shadow-sm  w-100"  onClick={() => setIsOpen(true)}>Open modal</button> */}



        
              <div className='d-flex align-items-start justify-content-center'>
                <img
                    src={GPTTask.logo ? GPTTask.logo : taskicon}
                    alt="Logo Preview"
                    className="mt-2"
                    style={{ maxWidth: "100%", maxHeight: "4rem" }}
                />
                
                <a href='#' onClick={handleImageClick}>
                  <img
                    src={editicontask}
                    alt="Logo Preview"
                    className="edit-task-icon"
                    
                /></a>
                <input ref={fileInputRef} type="file" className="d-none" id="logo" name="logo" onChange={handleLogoChange} accept="image/*" />
                </div>
               
                <div className="mb-1 w-100">

                { !isLoaded &&
                <div className='d-flex justify-content-center align-items-center'>
                    <div className="spinner-border text-white m-3 " role="status">
                        <span className="visually-hidden">En attente des résultats...</span>
                    </div>
                </div>
                }

                <ul className="nav nav-pills shadow-sm gpt-tabs mb-3 mt-2" id="myTab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button className="nav-link active" id="home-tab" data-bs-toggle="tab" data-bs-target="#home" type="button" role="tab" aria-controls="home" aria-selected="true">General</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile" type="button" role="tab" aria-controls="profile" aria-selected="false">Code</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#schedule" type="button" role="tab" aria-controls="schedule" aria-selected="false">Schedule</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="contact-tab" data-bs-toggle="tab" data-bs-target="#contact" type="button" role="tab" aria-controls="contact" aria-selected="false">Run history</button>
                  </li>
                </ul>

                


                <div className="tab-content" id="myTabContent">
                  <div className="tab-pane fade show active" id="home" role="tabpanel" aria-labelledby="home-tab">
                    
              <div className="mb-1 w-100">
                <label htmlFor="name" className="form-label text-white fw-bold mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={GPTTask.name}
                  onChange={handleInputChange}
                  autoFocus
                />
              </div>

        

         <div className="mb-1 w-100">
                <label htmlFor="category" className="form-label text-white fw-bold mb-1">
                Category
                </label>
                <select
                  className="form-select form-select-sm"
                  id="category"
                  name="category"
                  value={GPTTask.category}
                  onChange={handleInputChange}
                >
                            <option value=""></option>
                            <option value="Support">Support</option>
                            <option value="Fix">Fix</option>
                </select>
              </div>



          <div className="mb-1 w-100">
                <label htmlFor="language" className="form-label text-white fw-bold mb-1">
                  Language
                </label>

          <select className="form-select form-select-sm "
            name='language'
            value={GPTTask.language} // ...force the select's value to match the state variable...
            onChange={handleInputChange} // ... and update the state variable on any change!
          >
            <option value="python">Python</option>
            <option value="powershell">Powershell</option>
          </select>

          </div>

          <div className="mb-1 w-100">

          <label  className="form-label text-white fw-bold mb-1">
                  Connection
          </label>

          <ReactSearchAutocomplete

            inputSearchString={connection}
            items={items}
            onSearch={handleOnSearch}
            onHover={handleOnHover}
            onSelect={handleOnSelect}
            onFocus={handleOnFocus}
            formatResult={formatResult}
            styling={ {borderRadius: '4px', height: "30px",}}
          />

          </div>


                  </div>
                  <div className="tab-pane fade" id="profile" role="tabpanel" aria-labelledby="profile-tab">

                  <div className="mb-1 w-100">

<label htmlFor="prompt"  className="form-label text-white fw-bold mb-1">
        Prompt
</label>

<div className="shadow-sm bg-white w-100 editor-container">

<MDEditor
        value={GPTTask.prompt}
        onChange={code => setPrompt(code)}
        className="p-1"
        height="400px"
        highlightEnable={false}
        previewOptions={{
          rehypePlugins: [[rehypeSanitize]],
        }}
      />

  
  <button className="btn btn-primary shadow-sm rounded-0  w-100" type="submit" onClick={complete}>
   Send
  </button>
</div>


</div>


{isLoaded && GPTTask.parameters &&
            <div className="w-100 my-3 ">
<label className="form-label text-white fw-bold mb-1">
        Parameters
</label>
<div className="p-1 border rounded shadow-sm bg-white">
<table className="table table-striped">
<thead>
  <tr>
    <th scope="col">#</th>
    <th scope="col">Name</th>
    <th scope="col">Type</th>
    <th scope="col">Required</th>
    <th scope="col">Default</th>
  </tr>
</thead>
<tbody>
    {GPTTask.parameters.map((param, idx) => (
    <tr key={idx}>
    <th scope="row">{idx+1}</th>
   <td>
      {param.name}
      </td>
    <td>
    <select
      className="form-select"
      id={param.name}
      name={param.name}
      value={param.type}
      onChange={handleParamInputChange}
    >
                  <option value="text">text</option>
                  <option value="choice">choice</option>
                  <option value="date">date</option>
                  <option value="boolean">boolean</option>
                  <option value="number">number</option>
    </select>
    </td>
    <td>
    <div className="form-check form-switch">
      <input
      className="form-check-input"
      type="checkbox"
      id={"required_" + param.name}
      name={"required_" +param.name}
      checked={param.required}
      onChange={handleParamInputChange}
         />
    </div>
    </td>
    <td>
      <input
      type="text"
      className="form-control"
      id={"default_" + param.name}
      name={"default_" +param.name}
      value={param.default}
      onChange={handleParamInputChange}
    />
      </td>
    </tr>
    ))}
    </tbody>
  </table>
  </div>
  </div>
}


{isLoaded && GPTTask.connections_id && GPTTask.connections_id.length > 0 &&
            <div className="w-100 my-3 ">
<label className="form-label text-white fw-bold mb-1">
        Connections
</label>
<div className="p-1 border rounded shadow-sm bg-white">
<table className="table table-striped">
<thead>
  <tr>
    <th scope="col">#</th>
    <th scope="col">Name</th>
  </tr>
</thead>
<tbody>
    {GPTTask.connections_id.map((param, idx) => (
    <tr key={idx}>
    <th scope="row">{idx+1}</th>
   <td>
      {param}
      </td>
    </tr>
    ))}
    </tbody>
  </table>
  </div>
  </div>
}

{isLoaded && GPTTask.code &&
           <div className="mb-1 w-100 mt-2">
            <div className="accordion accordion-flush bg-transparent " id="accordionFlushExample">
            <div className="accordion-item p-0 bg-transparent ">
              <h2 className="accordion-header  fs-6" id="flush-headingOne">
                <button className="accordion-button collapsed shadow-0  px-0 py-1 pt-3 bg-transparent text-white fw-bold mb-1" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne" aria-expanded="true" aria-controls="flush-collapseOne">
                Code
                </button>
              </h2>
              <div id="flush-collapseOne" className="accordion-collapse collapse show " aria-labelledby="flush-headingOne" data-bs-parent="#accordionFlushExample">
                <div className="accordion-body bg-transparent p-0 ">


              <div className="code-editor d-flex  p-2 border rounded shadow-sm bg-white text-secondary w-100 d-flex flex-column position-relative">
                <div className="position-absolute text-success  btn-copy-code">
                  {copySuccess}
                  <button className="btn btn-secondary btn-sm ms-1" onClick={() => copyToClipboard(GPTTask.code, 1)}>Copy</button>
                </div>
                <Editor
                  name='code'
                  value={GPTTask.code}
                  //onChange={handleInputChange}
                  onValueChange={code => setGPTTask(GPTTask => ({...GPTTask, code: code}))}
                  highlight={code => highlight(code, (GPTTask.language == "powershell" ? languages.powershell : languages.python), GPTTask.language)}
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                    //maxHeight: 400,
                    //overflowY: 'auto',
                    paddingTop: '5px'
                  }}
                />
              </div>
              </div>
              </div>
              </div>
              </div>
              </div>
          }

{isLoaded && GPTTask.code &&
            <button className="btn btn-dark p-1 my-2 shadow-sm  w-100"  onClick={startExecuteCode}>Run code</button>
          }

          {isLoaded && GPTTask.executions.length > 0 && GPTTask.executions[GPTTask.executions.length - 1].code_execution_result &&
            <div className="w-100 my-1">

        <div className="accordion accordion-flush bg-transparent " id="accordionFlushExample2">
            <div className="accordion-item p-0 bg-transparent ">
              <h2 className="accordion-header  fs-6" id="flush-headingOne2">
                <button className="accordion-button collapsed shadow-0  px-0 py-1 pt-3 bg-transparent text-white fw-bold mb-1" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne2" aria-expanded="false" aria-controls="flush-collapseOne2">
                Output (Last execution)
                </button>
              </h2>
              <div id="flush-collapseOne2" className="accordion-collapse collapse " aria-labelledby="flush-headingOne2" data-bs-parent="#accordionFlushExample2">
                <div className="accordion-body bg-transparent p-0 ">
              
              <div className="d-flex mt-1 mb-2 p-2 border rounded shadow-sm bg-white text-secondary w-100 d-flex flex-column position-relative">
                    <div className="position-absolute text-success  btn-copy-code">
                      {copySuccess2}
                      <button className="btn btn-secondary btn-sm ms-1" onClick={() => copyToClipboard(GPTTask.executions[GPTTask.executions.length - 1].code_execution_result, 2)}>Copy</button>
                    </div>

                    <div className="p-2 bg-white text-secondary  w-100" dangerouslySetInnerHTML={{__html: GPTTask.executions[GPTTask.executions.length - 1].code_execution_result}}></div>
                </div>

                {/* <button className="btn btn-primary p-1 my-2 shadow-sm  w-100"  onClick={handleCreateFormSubmit}>Save GPT Task</button> */}

            </div>
            </div>
              </div>
              </div>
              </div>


          }



                  </div>
                  <div className="tab-pane fade" id="schedule" role="tabpanel" aria-labelledby="schedule-tab">

                  {isLoaded &&  
                  <div>
              <div className="form-check">
              <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1" />
              <label className="form-check-label" htmlFor="flexRadioDefault1">
                Default radio
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" checked />
              <label className="form-check-label d-inline-block me-2" htmlFor="flexRadioDefault2">
                Every
              </label>
              <input
              type="text"
              className="form-control me-2 d-inline-block time-schedule"
              id="EveryMinute"
              name="EveryMinute"
              value={GPTTask.schedule_value}
              onChange={handleScheduleChange}
              />
              minutes
            </div>
                  </div>
                  }
                  

                  </div>
                  <div className="tab-pane fade" id="contact" role="tabpanel" aria-labelledby="contact-tab">

                  {isLoaded && GPTTask.executions.length > 0 && GPTTask.executions[GPTTask.executions.length - 1] &&
            <div className="w-100 my-1">
              <label  className="form-label text-white fw-bold mb-1">
                      Run history
              </label>
              <div className="d-flex mt-1 mb-2 p-2 border rounded shadow-sm bg-white text-secondary w-100 d-flex flex-column position-relative run-history">
                <table className="table table-striped">
                      <thead>
                          <tr>
                              <th>Id</th>
                              <th>Start</th>
                              <th>Duration</th>
                              <th>Status</th>
                          </tr>
                      </thead>
                      <tbody>

                      {GPTTask.executions.filter(e => e.end_date).reverse().map(execution => (


                            <tr key={execution.id}>
                                <td>{execution.id}</td>
                                <td>{new Date(execution.start_date).toLocaleString()}</td>
                                <td>{dateDiffToString(new Date(execution.end_date),new Date(execution.start_date))}</td>
                                <td>{execution.status}</td>
                            </tr>


                      ))}
                      </tbody>
                  </table>
                </div>

                {/* <button className="btn btn-primary p-1 my-2 shadow-sm  w-100"  onClick={handleCreateFormSubmit}>Save GPT Task</button> */}

            </div>


          }

                  </div>
                </div>
                </div>

          

          </div>


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
      </div>

    </div>
  );
}
