export function arr(value) {
    if (!value)
        return [];
    return Array.isArray(value) ? value : [value];
}
export function firstText(...values) {
    for (const value of values) {
        if (value === undefined || value === null)
            continue;
        const text = String(value).trim();
        if (text.length > 0)
            return text;
    }
    return '';
}
export function onlyDigits(value) {
    return String(value ?? '').replace(/\D/g, '');
}
export function getPath(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
//# sourceMappingURL=object.js.map