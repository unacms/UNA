import React from 'react';
import Field from './_field';
import { useController, useFormContext, ControllerProps, UseControllerProps } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { useState, useRef  } from 'react';
import { View } from 'app/design/view'
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import QuillEditor, { QuillToolbar } from 'react-native-cn-quill';

export default function FormFieldText(props) {
    
   // const formContext = useFormContext();
//    const { formState } = formContext;
    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    
    const { field } = useController({ name, rules, defaultValue });
    const [height, setHeight] = useState(null);
    const editorRef = useRef(null);
    const [editorContent, setEditorContent] = useState('');

    const saveContent = async () => {
        try {
          const content = await editorRef.current.getHtml();
          setEditorContent(content);
        } catch (error) {
          console.error('Error getting editor content:', error);
        }
      };

      const styles = StyleSheet.create({
        container: {
          flex: 1,
        },
        editorContainer: {
          flex: 1,
          paddingTop: 10,
        },
        editor: {
          backgroundColor: '#F5FCFF',
        },
      });

    let input = <Input
        multiline
        editable
        numberOfLines={props.numLines ? props.numLines : 4}
        name={props.name}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        value={field.value}
    />
    if (props.html == 2){
        const _editor = React.createRef();
        const styles = StyleSheet.create({
            title: {
              fontWeight: 'bold',
              alignSelf: 'center',
              paddingVertical: 10,
            },
            root: {
              flex: 1,
              marginTop: StatusBar.currentHeight || 0,
              backgroundColor: '#eaeaea',
            },
            editor: {
              flex: 1,
              padding: 0,
              borderColor: 'gray',
              borderWidth: 1,
              marginHorizontal: 30,
              marginVertical: 5,
              backgroundColor: 'white',
            },
          });

        input = <View><View style={styles.editorContainer}>
        <QuillEditor
          ref={editorRef}
          initialHtml={'<p>Start editing here...</p>'}
          style={styles.editor}
        />
      </View>
      
      {editorContent && (
        <View>
          <Text>Editor content:</Text>
          <Text>{editorContent}</Text>
        </View>
      )}</View>
    }
    else{
        if (props.autoheight)
            input = <Input
                multiline
                editable
                style={{height: height}}
                numberOfLines={props.numLines ? props.numLines : 4}
                onContentSizeChange={e => setHeight(e.nativeEvent.contentSize.height > 70 ? 70 : e.nativeEvent.contentSize.height < 46 ? 46 : e.nativeEvent.contentSize.height)}
                name={props.name}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                value={field.value}
            />
    }
    return (
        <Field {...props}>{input}</Field>
    );
}
