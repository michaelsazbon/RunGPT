<div align="center">
  <img src="assets/icon.png" />
  <h1>RunGPT</h1>
</div>


<div align="center">



<h3>
Execute or schedule execution of the code generated from ChatGPT in a nice UI on your computer
</h3>

</div>

## Development status

The development of RunGPT started around 02/23 sometimes after the release of ChatGPT and then a lot of similar projects showed up (Auto-GPT, GPT Engineer...). The project is not maintained anymore since 06/23 but if someone want to contribute he is welcome :-)

## Initial Idea

The idea behind this project is to allow a basic developper to create automation script with only a single prompt. The automation script can take parameters in input if they are provided like {parameter1} and set at each execution (or with a default value). Then the automation can be runed manually or scheduled to run every x minutes...

## Features

- Use a single prompt to define a short description of the program you need in a Markdown editor
- Use ChatGPT API or Bing API (Experimental)
- Generate the code in Python or Powershell (Windows)
- Execute the generated code and get the result
- Schedule the execution of generated code and see the last executions

## Dependencies

- Python 3.10+ already installed and in the PATH (for Python language)

## Install

Clone the repo and install dependencies:

```bash
git clone https://github.com/michaelsazbon/RunGPT your-project-name
cd your-project-name
npm i
```

## Starting Development

- The project is using : https://github.com/electron-react-boilerplate/electron-react-boilerplate
Start the app in the `dev` environment:

```bash
npm start
```

## Packaging for Production

To package apps for the local platform:

```bash
npm run package
```

## Warranty

You can use this source for personal use

No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS, ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR FREEDOM FROM INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE ERROR FREE, OR ANY WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO THE SUBJECT SOFTWARE. THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN ENDORSEMENT BY GOVERNMENT AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS, RESULTING DESIGNS, HARDWARE, SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS RESULTING FROM USE OF THE SUBJECT SOFTWARE. FURTHER, GOVERNMENT AGENCY DISCLAIMS ALL WARRANTIES AND LIABILITIES REGARDING THIRD-PARTY SOFTWARE, IF PRESENT IN THE ORIGINAL SOFTWARE, AND DISTRIBUTES IT "AS IS."

