export function setAttributes(el, attrs) {
    const { class: className, style, dataset, ...otherAttrs } = attrs;
        
    if (className) {
        el.className = typeof className === 'string' ? className : '';
    }
    
    if (style) {
        Object.entries(style).forEach(([prop, value]) => {
            el.style[prop] = value;
        });
    }
    
    if (dataset) {
        Object.entries(dataset).forEach(([key, value]) => {
            el.dataset[key] = value;
        });
    }
    
    for (const [name, value] of Object.entries(otherAttrs)) {
        if (value == null) {
            el[name] = null;
            el.removeAttribute(name);
        } else if (name.startsWith('data-')) {
            el.setAttribute(name, value);
        } else {
            el.setAttribute(name, value);
            if (typeof value === 'boolean') {
                el[name] = value;
            }
        }
    }
}