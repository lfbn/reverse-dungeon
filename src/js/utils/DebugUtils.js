export default class DebugUtils {
    /**
     * Logs the value to the console in a formatted way.
     * @param {*} value - The value to dump.
     * @param {string} [label] - Optional label for the output.
     */
    static dump(value, label = 'Dump') {
        console.log(`==== ${label} ====`);
        console.dir(value, { depth: null, colors: true });
        console.log('================');
    }

    /**
     * Dumps the value and halts execution by throwing an error.
     * @param {*} value - The value to dump and die.
     * @param {string} [label] - Optional label for the output.
     */
    static dd(value, label = 'Dump & Die') {
        this.dump(value, label);
        throw new Error('Execution halted by DebugUtils.dd()');
    }
}