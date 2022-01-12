export function getText(x : string, y : string){
    const x_number : number = parseInt(x);
    const y_number : number = parseInt(y);

    const x_sign = x_number >= 0 ? '' : '-';
    const y_sign = y_number >= 0 ? '' : '-';

    const x_abs = Math.abs(x_number);
    const y_abs = Math.abs(y_number);

    return `${x_sign}${x_abs.toString().padStart(3, "0")},${y_sign}${y_abs.toString().padStart(3, "0")}`;
}