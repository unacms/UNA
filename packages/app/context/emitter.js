import { EventEmitter } from 'fbemitter';

const emitter = new EventEmitter();
export default emitter;

//import emitter from 'app/context/emitter';
//emitter.emit('editor', { action: 'blur' })
//emitter.emit('editor', { action: 'focus' })