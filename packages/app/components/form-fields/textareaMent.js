import { SafeAreaView, KeyboardAvoidingView } from 'react-native';
import { useEditorBridge, RichText, Toolbar, TenTapStartKit, CodeBridge,BridgeExtension  } from '@10play/tentap-editor';
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { useController } from 'react-hook-form';
import { Theme } from 'app/design/theme';
import Mention from '@tiptap/extension-mention'
import { Suggestion } from 'app/lib/editor-helpers2'
import { getAlert } from 'app/lib/util';
import  { useLayoutData } from 'app/context/layout';


export const MentionBridge = new BridgeExtension({
    tiptapExtension: Mention.configure({
        HTMLAttributes: {
            class: 'mention',
          },
      suggestion: {
        items: ({ query }) => {
          return [
            'Lea Thompson', 'Cyndi Lauper', 'Tom Cruise', 'Madonna', 'Jerry Hall', 'Joan Collins', 'Winona Ryder', 'Christina Applegate', 'Alyssa Milano', 'Molly Ringwald', 'Ally Sheedy', 'Debbie Harry', 'Olivia Newton-John', 'Elton John', 'Michael J. Fox', 'Axl Rose', 'Emilio Estevez', 'Ralph Macchio', 'Rob Lowe', 'Jennifer Grey', 'Mickey Rourke', 'John Cusack', 'Matthew Broderick', 'Justine Bateman', 'Lisa Bonet',
          ].filter(item => item.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5)
        },
      
        render: () => {
          let reactRenderer
          let popup
      
          return {
            onStart: props => {
      
              if (!props.clientRect) {
                return
              }
      
              reactRenderer = new ReactRenderer(MentionList, {
                props,
                editor: props.editor,
              })
      
              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: reactRenderer.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },
      
            onUpdate(props) {
              reactRenderer.updateProps(props)
      
              if (!props.clientRect) {
                return
              }
      
              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              })
            },
      
            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup[0].hide()
      
                return true
              }
      
              return reactRenderer.ref?.onKeyDown(props)
            },
      
            onExit() {
              popup[0].destroy()
              reactRenderer.destroy()
            },
          }
        }
    }
    }),
    onBridgeMessage: (editor, message) => {
      console.log('render2 - onBridgeMessage called', message);
    },
    extendEditorInstance: (sendBridgeMessage) => {
      console.log('render3 - extendEditorInstance called');
      return {
        mentionUser: (user) => sendBridgeMessage({
          type: 'MentionUser',
          payload: user,
        }),
      };
    },
    extendEditorState: () => {
      return {};
    },
  });

  
  // Компонент списка упоминаний
  const MentionList = ({ items, command }) => {
    const [visible, setVisible] = useState(true);
  
    if (!visible || items.length === 0) return null;
  
    return (
      <View style={{
        position: 'absolute',
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        elevation: 5,
        top: 40, left: 10, right: 10,
      }}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { 
              console.log('Mention selected:', item.label);
              command(item);
              setVisible(false);
            }}>
              <Text style={{ padding: 8 }}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };
  

export const MentionInput = ({ className, ...props }) => (
    <MentionInputDef className={'bg-bgrinput border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-focus focus:outline-none  focus:border-bdrinput-focus dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg   w-full p-2 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus placeholder-neutral-500 dark:text-neutral-100 text-[16px] leading-[22px] h-[40px]'} {...props} />
);

export const MentionInputMulti = ({ className, ...props }) => (
    <MentionInputDef className={'bg-bgrinput text-neutral-900 border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-focus focus:outline-none  focus:border-bdrinput-focus dark:focus:border-bdrinput-df rounded-lg   w-full p-2 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus placeholder-neutral-500 dark:text-neutral-100 text-[16px] leading-[22px]'} {...props} />
);

export const MentionInputMultiTransparent = ({ className,  ...props }) => {
    return(
    
    <MentionInputDef style={{
        borderColor: 'gray',
        borderWidth: 1,
        height: '22px',
        padding: 0,
        borderRadius: 5,
    }}  {...props} />
)};

const processImages = async (items) => {

    
    const imagePromises = items.map((src) => {
        const fileName = src.split('/').pop();
        const fileType = src.match(/\.([a-z0-9]+)$/i)[1];
        return {
            src,
            name: fileName,
            type: `image/${fileType}`,
        };

    });

    // Ждём завершения всех операций и собираем массив изображений

    
    console.log("Processed Images:", imagePromises);
    return images;
};


export default function ({ name, value = '', numLines = 4, ...props }) {
    const { layoutData, setLayoutData } = useLayoutData();
    const { field } = useController({ name, rules: {}, defaultValue: value });
    const { colors } = Theme();
    const customCodeBlockCSS = `
    body{
        font-size: ${props.fontSize || 16}px;
        line-height:  ${props.lineHeight || 20}px;
        color:  ${colors.text};
        background-color:  #111827; 
    }
     img{
     display: none;
    }
    `;

    const editor = useEditorBridge({
        autofocus: field.value ? true : false,
        avoidIosKeyboard: true,
        placeholder:props.placeholder,
        initialContent: field.value,
        bridgeExtensions: [
            // It is important to spread StarterKit BEFORE our extended plugin,
            // as plugin duplicated will be ignored
            ...TenTapStartKit,
            MentionBridge,
          
          
            CodeBridge.configureCSS(customCodeBlockCSS), // Custom codeblock css
          ],
        onChange: async () => {
            if (editor) {
              const htmlContent = await editor.getHTML();
              const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
              let match;
              let images = [];

     
              while ((match = imgRegex.exec(htmlContent)) !== null) {
                const src = match[1];
                const fileName = src.split('/').pop()+'.png';
                const fileTypeMatch = src.match(/\.([a-z0-9]+)$/i);
                const fileType = fileTypeMatch ? `image/${fileTypeMatch[1]}` : 'image/png';
        
                images.push({
                  uri:src,
                  fileName: fileName,
                  mimeType: fileType,
                });
              }
        
              if (images.length > 0) {
    
        
                // 🔹 Удаляем все <img> из HTML
              //  htmlContent = htmlContent.replace(imgRegex, "");
            
                setLayoutData(getAlert('images:pasted', images));
                
              }
              field.onChange(htmlContent)
            }
        }
      });



      return (
        <View className="h-full ">
        <RichText editor={editor} />
        <View className="h-12 bg-red-500"><Toolbar editor={editor} /></View>
    </View>
    )
}
