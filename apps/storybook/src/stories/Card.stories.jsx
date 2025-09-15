import React from 'react';
import {
  Card,
  CardList,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "app/ui/molecules/card";
import { Text } from "app/design/typography";

export default {
  title: "Design/Card",
  component: Card,
  argTypes: {
    showHeader: {
      control: "boolean",
      defaultValue: true,
    },
    showTitle: {
      control: "boolean",
      defaultValue: true,
    },
    showDescription: {
      control: "boolean", 
      defaultValue: true,
    },
    showContent: {
      control: "boolean",
      defaultValue: true,
    },
    showFooter: {
      control: "boolean",
      defaultValue: true,
    },
    direction: {
      control: "select",
      options: ["ltr", "rtl"],
      defaultValue: "ltr",
    },
    title: {
      control: "text",
      defaultValue: "Card title",
    },
    description: {
      control: "text",
      defaultValue: "Optional description",
    },
    content: {
      control: "text",
      defaultValue: "This is the card content. Use semantic tokens so it adapts to light/dark themes.",
    },
    footer: {
      control: "text",
      defaultValue: "Footer actions or meta",
    },
  },
};

export const DefaultCard = (args) => {
  // Debug: Check what's in the Card component's className
  const cardRef = React.useRef(null);
  
  React.useEffect(() => {
    if (cardRef.current) {
      console.log('Actual Card className:', cardRef.current.className);
      console.log('Card element:', cardRef.current);
    }
  });

  return (
    <div 
      dir={args.direction}
      className="min-h-screen bg-background p-4"
    >
      <Card ref={cardRef} className="max-w-md">
        {args.showHeader && (args.showTitle || args.showDescription) && (
          <CardHeader>
            {args.showTitle && (
              <CardTitle>{args.title}</CardTitle>
            )}
            {args.showDescription && (
              <CardDescription>{args.description}</CardDescription>
            )}
          </CardHeader>
        )}
        {args.showContent && (
          <CardContent>
            <Text>{args.content}</Text>
          </CardContent>
        )}
        {args.showFooter && (
          <CardFooter>
            <Text className="text-sm text-muted-foreground">{args.footer}</Text>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

DefaultCard.args = {
  showHeader: true,
  showTitle: true,
  showDescription: true,
  showContent: true,
  showFooter: true,
  direction: "ltr",
  title: "Card title",
  description: "Optional description",
  content: "This is the card content. Use semantic tokens so it adapts to light/dark themes.",
  footer: "Footer actions or meta",
};

export const CardListStory = (args) => {
  const items = Array.from({ length: args.itemCount }, (_, i) => ({
    id: i + 1,
    title: `${args.itemTitle} ${i + 1}`,
    content: `${args.itemContent} ${i + 1}`,
  }));

  return (
    <div 
      dir={args.direction}
      className="min-h-screen bg-background p-4"
    >
      <CardList className="max-w-md">
        {items.map((item) => (
          <CardContent key={item.id}>
            {args.showItemTitle && (
              <Text className="text-card-foreground font-semibold mb-1">
                {item.title}
              </Text>
            )}
            {args.showItemContent && (
              <Text className="text-card-foreground text-sm">
                {item.content}
              </Text>
            )}
          </CardContent>
        ))}
      </CardList>
    </div>
  );
};

CardListStory.args = {
  itemCount: 3,
  showItemTitle: true,
  showItemContent: true,
  direction: "ltr",
  itemTitle: "List Item",
  itemContent: "This is list item content",
};

CardListStory.argTypes = {
  itemCount: {
    control: { type: "range", min: 1, max: 10, step: 1 },
    defaultValue: 3,
  },
  showItemTitle: {
    control: "boolean",
    defaultValue: true,
  },
  showItemContent: {
    control: "boolean",
    defaultValue: true,
  },
  direction: {
    control: "select",
    options: ["ltr", "rtl"],
    defaultValue: "ltr",
  },
  itemTitle: {
    control: "text",
    defaultValue: "List Item",
  },
  itemContent: {
    control: "text",
    defaultValue: "This is list item content",
  },
};



