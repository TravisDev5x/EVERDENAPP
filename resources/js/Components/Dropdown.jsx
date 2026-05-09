import { Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import {
    Children,
    cloneElement,
    createContext,
    isValidElement,
    useContext,
    useEffect,
    useState,
} from 'react';

const DropDownContext = createContext(null);

const Dropdown = ({ children }) => {
    const [open, setOpen] = useState(false);
    const toggleOpen = () => setOpen((previousState) => !previousState);

    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
            <div className="relative">{children}</div>
        </DropDownContext.Provider>
    );
};

const Trigger = ({ children }) => {
    const { open, setOpen, toggleOpen } = useContext(DropDownContext);

    const augment = (node) => {
        if (!isValidElement(node)) {
            return node;
        }
        if (node.type === 'button' || node.props?.type === 'button') {
            return cloneElement(node, {
                onClick: (e) => {
                    node.props.onClick?.(e);
                    toggleOpen();
                },
                'aria-expanded': open,
                'aria-haspopup': 'menu',
                type: node.props.type ?? 'button',
                id: node.props.id ?? 'dropdown-menu-button',
                className: [
                    node.props.className,
                    'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
                ]
                    .filter(Boolean)
                    .join(' '),
            });
        }
        const mapped = Children.map(node.props.children, (c) => augment(c));
        return cloneElement(node, { children: mapped });
    };

    const triggerChild = augment(children);

    return (
        <>
            {triggerChild}
            {open && (
                <div
                    className="fixed inset-0 z-40"
                    aria-hidden="true"
                    onClick={() => setOpen(false)}
                />
            )}
        </>
    );
};

const Content = ({
    align = 'right',
    width = '48',
    placement = 'bottom',
    menuButtonId = 'dropdown-menu-button',
    contentClasses = 'py-1 bg-white dark:bg-slate-800',
    children,
}) => {
    const { open, setOpen } = useContext(DropDownContext);

    let alignmentClasses = 'origin-top';

    if (align === 'left') {
        alignmentClasses = 'ltr:origin-top-left rtl:origin-top-right start-0';
    } else if (align === 'right') {
        alignmentClasses = 'ltr:origin-top-right rtl:origin-top-left end-0';
    }

    let widthClasses = '';

    if (width === '48') {
        widthClasses = 'w-48';
    } else if (width === '56') {
        widthClasses = 'w-56';
    }

    const placementClasses =
        placement === 'top'
            ? 'bottom-full mb-2 origin-bottom'
            : 'top-full mt-2 origin-top';

    return (
        <>
            <Transition
                show={open}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <div
                    className={`absolute z-[60] rounded-xl shadow-lg ${placementClasses} ${alignmentClasses} ${widthClasses}`}
                    id="user-menu-dropdown"
                    role="menu"
                    aria-labelledby={menuButtonId}
                    onClick={() => setOpen(false)}
                >
                    <div
                        className={
                            `rounded-md ring-1 ring-black/5 dark:ring-white/10 ` +
                            contentClasses
                        }
                    >
                        {children}
                    </div>
                </div>
            </Transition>
        </>
    );
};

const DropdownLink = ({ className = '', children, ...props }) => {
    return (
        <Link
            {...props}
            role="menuitem"
            className={
                'block w-full px-4 py-2.5 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:bg-slate-700 dark:focus-visible:ring-indigo-400 ' +
                className
            }
        >
            {children}
        </Link>
    );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;

export default Dropdown;
