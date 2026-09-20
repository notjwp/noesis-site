import { test, eq } from './harness.js';
import { COMMANDS, detectOS } from '../js/install.js';

test('COMMANDS are the README lines verbatim', () => {
  eq(COMMANDS.unix, 'git clone --filter=blob:none --sparse https://github.com/notjwp/Noesis.git && cd Noesis && python3 install.py');
  eq(COMMANDS.windows, 'git clone --filter=blob:none --sparse https://github.com/notjwp/Noesis.git; cd Noesis; python install.py');
});
test('detectOS', () => { eq(detectOS('Win32'), 'windows'); eq(detectOS('Windows'), 'windows'); eq(detectOS('MacIntel'), 'unix'); eq(detectOS('Linux x86_64'), 'unix'); eq(detectOS(''), 'unix'); });
