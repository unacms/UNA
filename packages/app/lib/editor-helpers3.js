import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { View, Row } from 'app/design/view'
import { Button } from 'app/design/controls';

export default forwardRef((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = index => {
        const item = props.items[index]

        if (item) {
            props.command({ id: item })
            props.editor.chain().focus().insertContent({ type: 'text', text: '\u00A0' }).run();
        }
    }

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
    }

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
    }

    const enterHandler = () => {
        selectItem(selectedIndex)
    }

    useEffect(() => setSelectedIndex(0), [props.items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }

            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }

            if (event.key === 'Enter') {
                enterHandler()
                return true
            }

            return false
        },
    }))

    return (
        <div className="items">
            {props.items.length
                ? props.items.map((item, index) => (
                    
                    <Button
                        pressed = {index === selectedIndex ? true : false}
                        key={index}
                        variant="text"
                        fullWidth
                        align="left"
                        onPress={() => selectItem(index)}
                    >
                        {item.label}
                    </Button>
 
                ))
                : <></>
            }
        </div>
    )
})