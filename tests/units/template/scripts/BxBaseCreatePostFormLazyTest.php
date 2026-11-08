<?php

/**
 * The "Create post" block renders only the composer placeholder: the module's form, its editor
 * and uploaders are loaded by BxDolCreatePost.js when the member is about to use it.
 */
class BxBaseCreatePostFormLazyTest extends BxDolTestCase
{
    protected function render(): string
    {
        return BxDolTemplate::getInstance()->parseHtmlByName('create_post_form.html', [
            'default' => 'bx_posts',
            'default_uri' => 'posts',
            'placeholder' => 'Write here...',
            'user_thumb' => '',
            'js_object' => 'oBxDolCreatePost',
            'js_content' => '',
        ]);
    }

    public function testPlaceholderIsAKeyboardButtonThatLoadsTheForm()
    {
        $s = $this->render();

        $this->assertMatchesRegularExpression('/class="sys-cpf-form sys-cpf-default[^"]*"[^>]*role="button"[^>]*tabindex="0"/', $s);
        $this->assertStringContainsString("oBxDolCreatePost.getForm('bx_posts', 'posts', this)", $s);
    }

    public function testFormIsNotRenderedUpFront()
    {
        $s = $this->render();

        $this->assertMatchesRegularExpression('/<div class="sys-cpf-form sys-cpf-bx_posts" style="display:none">\s*<\/div>/', $s);
        $this->assertStringNotContainsString('<form', $s);
        $this->assertStringNotContainsString('__form__', $s);
    }
}
