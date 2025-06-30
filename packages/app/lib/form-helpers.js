
import { getComponent } from 'app/components/registry';
import { Text } from 'app/design/typography'
import { Button } from "app/design/controls";
import emitter from 'app/context/emitter';

export function getFormFieldByData(inputData, handleSubmit, format, externalProps) {

    if (!inputData)
        return <></>;
    const InputType = getComponent('form-field', String(inputData.type));

    if (!InputType)
        return <Text>Unsupported field type: {JSON.stringify(inputData)}</Text>
    return <InputType key={inputData.name} {...inputData} format={format} handleSubmit={handleSubmit} {...externalProps} />;

}

export function getHiddenFields(inputs, handleSubmit) {
    return Object.keys(inputs)
        .map((key) => {
            if (inputs[key].type === "hidden") {
                return getFormFieldByData(inputs[key], handleSubmit, 'nofield');
            }
            return null;
        })
        .filter((element) => element !== null);
}

export function inputByKey(array, value) {
    return array.find(obj => obj['key'] === value);
}

export function getEditorHeight(reportedContentHeight, minVisualHeight, totalChromeHeight, growthStep, maxHeight) {
    const contentSpaceInMinVisualHeight = minVisualHeight - totalChromeHeight;

    if (reportedContentHeight <= contentSpaceInMinVisualHeight) {
        return minVisualHeight;
    } else {
        const overflowHeight = reportedContentHeight - contentSpaceInMinVisualHeight;
        const stepsNeeded = Math.ceil(overflowHeight / growthStep);
        let newHeight = minVisualHeight + (stepsNeeded * growthStep);
        return Math.min(newHeight, maxHeight);
    }
}

export function PollButton({ field_name, size = 'base', variant = 'secondary', icon = "ChartBarBig" }) {
    return (
        <Button
            startDecorator={icon}
            size={size}
            variant={variant}
            rounded
            onPress={() => emitter.emit(`fld_polls_${field_name}`, { action: 'add' })}
        />
    );
}
