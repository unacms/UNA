import React from "react";
import Image from 'app/ui/atoms/image';
import { Row, View } from 'app/design/view';
import {
    H4,
    H5,
    H6,
    P,
    A,
    Strong,
    I,
    EM,
    Div,
    Li,
    Span,
    UL,
    Code,
    BR
} from "@expo/html-elements";
import Link from 'app/ui/atoms/link'
import { Text, H1, H2, H3 } from 'app/design/typography'

const StyledP = (props) => (
    <P className={`${!props.isLast ? 'mb-1' : 'mb-0'} ${!props.isFirst ? 'mt-1' : 'mb-0'} ${props.textStyles} `} >
        {props.children}
    </P>
);

const StyledLi = (props) => (
    <Row className={`ml-4 `}>
        <Text className={`${props.textStyles}`}>- {props.children}</Text>
    </Row>
);

const StyledUl = (props) => (
    <UL>
        {props.children}
    </UL>
);

const StyledText = (props) => {
    return <Text className={props.className}>
        {props.children}
    </Text>
};

const StyledDiv = (props) => (
    <View className={'p-0 m-0'} >
        {props.children}
    </View>
);

const tagMapping = {
    h1: H1,
    h2: H2,
    h3: H3,
    h4: StyledP,
    h5: StyledP,
    h6: StyledP,
    p: StyledP,
    strong: Strong,
    b: Strong,
    i: I,
    em: EM,
    code: Code,
    div: StyledDiv,
    li: StyledLi,
    span: StyledText,

    ul: StyledUl,
    ol: StyledUl,
};

const parseHtmlToReact = (html, textStyles, parentKey = "0") => {
    let childIndex = 0;
    const getKey = (tag) => `${parentKey}-${childIndex++}-${tag}`;
    const elements = [];
    html = html.replace(/<br\s*\/?>/gi, (_, index) => `<br key="${parentKey}-${index}-br"></br>`);


    html = html.replace(/<img\s*([^>]*)\/?>/gi, (match, attributes, index) => {
        return `<customimg ${attributes} key="${parentKey}-${index}-img"></customimg>`;
    });

    const mainTagRegex = /<([a-zA-Z0-9]+)([^>]*)>(.*?)<\/\1>/gis;
    let lastIndex = 0;
    let match;

    while ((match = mainTagRegex.exec(html)) !== null) {
        const [fullMatch, tag, attributes, content] = match;
        const normalizedTag = tag.toLowerCase();
        const textBefore = html.slice(lastIndex, match.index);
        lastIndex = mainTagRegex.lastIndex;
        if (textBefore.trim()) {
            elements.push(<Text>{textBefore.trimStart()}</Text>);
        }

        if (normalizedTag === "br") {
            elements.push(<Text>{"\n"}</Text>);
            continue;
        }

        const Component = tagMapping[normalizedTag] || Text;

        // Обработка изображений
        if (tag === "customimg") {
            const srcMatch = attributes.match(/src=['"]?([^'"\s>]+)['"]?/);
            if (srcMatch && srcMatch[1]) {
                elements.push(
                    <Image
                       
                    src={srcMatch[1]}
                    width={100}
                    height={100}
                />
                );
            }
            continue;
        }

        // Обработка ссылок
        if (tag === "a") {
            const hrefMatch = attributes.match(/href="([^"]+)"/);
            if (hrefMatch) {
                console.log('!!!content', content)
                elements.push(
                    <Link
                        href={hrefMatch[1]}
                        mode="text"
                    >
                        <Text className="text-primary">{content}</Text>


                    </Link>
                );
            }
            continue;
        }
        const srcClass = attributes.match(/class=['"]?([^'"\s>]+)['"]?/);
        elements.push(
            <Component
            
                className={srcClass && srcClass[1]}
                isFirst={false}
                isLast={false}
                textStyles={textStyles}
            >
                {parseHtmlToReact(content, textStyles, getKey("content"))}
            </Component>
        );
    }

    const remainingText = html.slice(lastIndex);
    if (remainingText.trim()) {
        elements.push(<Text key={getKey("end")}>{remainingText.trim()}</Text>);
    }

    if (elements.length > 0) {
        elements[0] = React.cloneElement(elements[0], { isFirst: true });
        elements[elements.length - 1] = React.cloneElement(elements[elements.length - 1], { isLast: true });
    }

    return elements;
};

export default function ElementHtml({ customClassName, data }) {
    console.log("htmlhtml", data)
    const textStyles = customClassName == 'u-vanilla-html-small' ? 'text-sm leading-[18px]' : 'text-base leading-[20px]';
    const html = data.replace(/\n|\r/g, '').replace(/&nbsp;/g, ' ');
    return <View>{parseHtmlToReact(html, textStyles)}</View>;
}
