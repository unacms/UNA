import { Text, H1 } from 'app/design/typography'
import { useState } from 'react';
import { Row, Pressable } from 'app/design/view';
import AuthGoogle from 'app/ui/atoms/auth/google';
import { appSetting } from 'app/lib/util'

export default function AuthPanel ({ text, className, numberOfLines, tagName }) {
    return (
        <Row className="gap-x-3">
            {appSetting('auth', 'google') && <AuthGoogle/>}
        </Row>
    );
}