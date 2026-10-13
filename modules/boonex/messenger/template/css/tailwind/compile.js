const util = require('util');
const fs = require('fs');
const exec = util.promisify(require('child_process').exec);

const sFiles = process.argv[2],
      sCommand = process.argv[3];

if (!sFiles)
    return;

async function runCommand(command) {
    console.log(command);
    const { stdout, stderr, error } = await exec(command);
    if(stderr){
        console.error('stderr:', stderr);
    }
    if(error){
        console.error('error:', error);
    }

    return stdout;
}

function processFile(file){
    if (sCommand === 'remove')
        return fs.unlink('../' + file, function(err){
            if (err)
                console.log(file + ' doesn\'t exists');
            else
                console.log(file + ' was removed');
        });
    else
    {
        if (file === 'tailwind-messenger.css')
            return runCommand(`npm run tailwind`);
        else
            return runCommand(`npx tailwindcss -i ./components/${file} -o ../${file} ${sCommand ? '--' + sCommand.toLowerCase() : ''}`);
    }
}

function* generator(files) {
    yield files.forEach((file) => processFile(file));
}

try {
    if (fs.lstatSync(sFiles).isDirectory())
        fs.readdir(sFiles, (err, files) => {
            const main = generator(files);
            while (!main.next().done) ;
        });
}
  catch(e)
{
    if(e.code === 'ENOENT'){
        if (fs.lstatSync('./components/' + sFiles).isFile())
            processFile(sFiles);
    }else {
        console.log(e.toString());
    }
}
