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
import { Platform } from 'react-native'
import { getPart } from 'app/lib/parts/part';

const StyledP = (props) => (
    <P className={`${props.islast == "false" ? 'mb-1' : 'mb-0'} ${props.isfirst == "false" ? 'mt-1' : 'mt-0'} ${props.textStyles} `}>
        {props.children}
    </P>
);

const StyledLi = (props) => (
    <Row className={`ml-4`} key={props.key}>
        <Text className={`${props.textStyles}`}>- {props.children}</Text>
    </Row>
);

const StyledUl = (props) => (
    <UL key={props.key}>
        {props.children}
    </UL>
);

const StyledText = (props) => (
    <Text className={props.className} key={props.key}>
        {props.children}
    </Text>
);

const StyledDiv = (props) => (
    <View className={'p-0 m-0'} key={props.key}>
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

    html = html.replace(/<br\s*\/?>/gi, (_, index) => `<br key="${getKey("br")}"></br>`);
    html = html.replace(/<img\s*([^>]*)\/?>/gi, (match, attributes, index) => {
        return `<customimg ${attributes} key="${getKey("img")}"></customimg>`;
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
            elements.push(<Text key={getKey("text-before")}>{textBefore.trimStart()}</Text>);
        }

        if (normalizedTag === "br") {
            elements.push(<Text key={getKey("br")}>{"\n"}</Text>);
            continue;
        }

        const Component = tagMapping[normalizedTag] || Text;

        if (tag === "customimg") {
            const srcMatch = attributes.match(/src=['"]?([^'"\s>]+)['"]?/);
            if (srcMatch && srcMatch[1]) {
                elements.push(
                    <Image key={getKey("image")} src={srcMatch[1]} width={100} height={100} />
                );
            }
            continue;
        }

        if (tag === "a") {
            const hrefMatch = attributes.match(/href="([^"]+)"/);
            const srcClass = attributes.match(/class=['"]?([^'"\s>]+)['"]?/);
            if (hrefMatch) {
                elements.push(
                    <Link key={getKey("link")} href={hrefMatch[1]} mode="text">
                        <View>
                           <Text className={" text-primary " + ((srcClass && srcClass[1]) ? getPart("ParseHtmlClasses", [srcClass[1], 'link']) : '')}>{content} </Text>
                        </View>
                    </Link>
                );
            }
            continue;
        }

        const srcClass = attributes.match(/class=['"]?([^'"\s>]+)['"]?/);
        elements.push(
            <Component
                key={getKey(tag)}
                className={srcClass && srcClass[1] ?  getPart("ParseHtmlClasses", [srcClass[1], 'text']) : '' }
                isfirst="false"
                islast="false"
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
        elements[0] = React.cloneElement(elements[0], { isfirst: "true" });
        elements[elements.length - 1] = React.cloneElement(elements[elements.length - 1], { islast: "true" });
    }

    return elements;
};

export default function ElementHtml({ customClassName, data }) {

    const textStyles = (customClassName?.includes('u-vanilla-html-small')  && Platform.OS ==='web') // MAY BE NEED TO IMPROVE
        ? 'text-[14px] leading-[18px] text-neutral-800 dark:text-neutral-200' 
        : 'text-[16px] leading-[20px] text-neutral-800 dark:text-neutral-200';
    if (!data)
        return null;
    let html = data.replace(/\n|\r/g, '').replace(/&nbsp;/g, ' ');
    if (html.trim() != '' && !html.includes('<p'))
        html = `<p>${html}</p>`;
    return <View className={`u-vanilla-html ${customClassName}`}>{parseHtmlToReact(html, textStyles)}</View>;
}
