import { appStatic } from 'app/lib/app-static';

export default function NoContent({endpoint}) {
     if (endpoint.unit == 'feed'){
          return null
     }
     return appStatic('components_content_empty')
}
