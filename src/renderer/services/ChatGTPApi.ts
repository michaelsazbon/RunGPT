import { Configuration, OpenAIApi } from 'openai';



const context = [

  /*'## engine: code-cushman-001',
  '## temperature: 0',
  '## max_tokens: 300',
  '## shell: powershell',
  '## multi_turn: off',
  '## token_count: 110',*/
  '',
  'what processes are hogging the most cpu?',
  'Get-Process | Sort-Object -Property CPU -Descending | Select-Object -First 10',
  '',
  'stop the chrome processes',
  'Get-Process chrome | Stop-Process',
  '',
  'what\'s my IP address?',
  '(Invoke-WebRequest -uri "http://ifconfig.me/ip").Content',
  '',
  'what\'s the weather in New York?',
  '(Invoke-WebRequest -uri "wttr.in/NewYork").Content',
  '',
  'make a git ignore with node modules and src in it',
  '"node_modules',
  'src" | Out-File .gitignore',
  '',
  'open it in notepad',
  'notepad .gitignore',
  '',
  'what\'s running on port 1018?',
  'Get-Process -Id (Get-NetTCPConnection -LocalPort 1018).OwningProcess',
  '',
  'kill process 1584',
  'Stop-Process -Id 1584',
  '',
  'what other devices are on my network?',
  'Get-NetIPAddress | Format-Table',
  '',
  'how much storage is left on my pc?',
  'Get-WmiObject -Class Win32_LogicalDisk | Select-Object -Property DeviceID,FreeSpace,Size,DriveType | Format-Table -AutoSize',
  '',
  'how many GB is 367247884288 B?',
  '(367247884288 / 1GB)', 
  '',
  'create a Word file and fill it with a joke',
  '$word = New-Object -ComObject Word.Application;$word.Visible = $true;$doc = $word.Documents.Add();$doc.Content.Text = "Hear about the new restaurant called Karma? There’s no menu: You get what you deserve.";$doc.SaveAs("C:\\Users\\$env:USERNAME\\Desktop\\joke.docx");$doc.Close();$word.Quit()'

].join('\n');


export async function completion(text: string) {
  const configuration = new Configuration({
    //apiKey: process.env.OPENAI_API_KEY,
    apiKey: <any>window.electron.store.get('apikey')
  });
  const openai = new OpenAIApi(configuration);
  const completion = await openai.createCompletion({
    model: 'code-davinci-002',
    prompt: '<# powershell #>\n\n' + context + '\n\n' + '# ' + text,
    max_tokens: 300,
    temperature: 0.0,
    stop: '#'
  });
  console.log(completion.data);

  return completion.data.choices[0].text;
};


export async function ChatGPTCompletion(cleaned_code: {instructions: string, code: string}) {


  //var instructions = 'write only c# code without any explanation\n\n';
  //var instructions = '';


  const configuration = new Configuration({
    //apiKey: process.env.OPENAI_API_KEY,
    apiKey: <any>window.electron.store.get('apikey')
  });
  const openai = new OpenAIApi(configuration);
  
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    //messages: [{role: "user", content: '<# powershell #>\n\n' + context + '\n\n' + '' + text}],
    messages: [
      {role: "system", content: cleaned_code.instructions},
      {role: "user", content: cleaned_code.code}
    ],
    max_tokens: 1500,
    temperature: 0.0,
    //stop: '#'
  });
  console.log(completion.data);

  return completion.data.choices[0].message?.content.trim();
};