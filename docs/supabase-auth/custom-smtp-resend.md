# Supabase Auth 使用 Resend 自定义 SMTP

本项目使用 Supabase Auth 做账号注册、邮箱验证和密码登录。注册验证邮件是由
Supabase Auth 发出的，不是 Next.js 应用代码直接发送的。

这份文档记录如何让 Supabase Auth 的验证邮件通过 Resend 发送，并显示成项目自己的
发件人，而不是默认的 `Supabase Auth <noreply@mail.app.supabase.io>`。

## 目标

- 注册验证邮件通过 Resend 发送。
- 邮件发件人显示为项目名称。
- 发件邮箱使用已验证的域名邮箱。
- 邮件标题和正文能明确说明这是 Developer Docs Progress Tracker 的账号验证邮件。

## 一、Resend 准备

1. 在 Resend 里验证一个发信域名。
2. 准备一个属于该域名的发件邮箱，例如：

   ```text
   noreply@your-domain.example
   ```

3. 创建一个 Resend API Key。
4. API Key 必须保密。如果泄露，立即在 Resend 里 revoke / rotate，然后换新的。

## 二、Supabase 配置 Custom SMTP

进入 Supabase Dashboard：

```text
Authentication -> Emails / SMTP Settings -> Enable Custom SMTP
```

填写 Resend SMTP 配置：

```text
Host: smtp.resend.com
Port: 465
Username: resend
Password: Resend API Key，例如 re_xxx
Sender name: Developer Docs Progress Tracker
Sender email: noreply@your-domain.example
```

注意：

- `Username` 固定填 `resend`，不要填邮箱。
- `Sender email` 必须是 Resend 已验证域名下的邮箱。
- Supabase Dashboard 里填的 Resend API Key 和项目 `.env` 里的 `RESEND_API_KEY`
  是两套配置；可以来自同一个 Resend 账号，但配置位置不同。
- 不要把真实 Resend API Key 提交到仓库。

## 三、修改 Supabase 验证邮件模板

进入 Supabase Dashboard：

```text
Authentication -> Email Templates -> Confirm signup
```

建议把邮件标题改成：

```text
Confirm your Developer Docs Progress Tracker account
```

邮件正文可以使用下面这个模板。必须保留 `{{ .ConfirmationURL }}`，这是 Supabase
生成的邮箱确认链接：

```html
<h2>Confirm your Developer Docs Progress Tracker account</h2>
<p>You created an account for Developer Docs Progress Tracker.</p>
<p>Click the link below to finish email verification and start using your account.</p>
<p>
  <a href="{{ .ConfirmationURL }}">Confirm account</a>
</p>
<p>If you did not create this account, you can ignore this email.</p>
```

## 四、配置跳转地址

Supabase Auth 必须允许验证邮件里的链接跳回应用的确认路由。

在 Supabase Dashboard 配置：

```text
Site URL: https://your-domain.example
Redirect URLs:
- http://localhost:3000/auth/confirm
- https://your-domain.example/auth/confirm
```

本项目注册时会使用：

```text
emailRedirectTo: {SITE_URL}/auth/confirm
```

本地如果没有设置 `SITE_URL`，代码会默认使用：

```text
http://localhost:3000
```

## 五、测试流程

1. 打开 `/signup`。
2. 输入邮箱和密码，点击 `Create account`。
3. 页面应该跳转到：

   ```text
   /account?status=check-email
   ```

4. 去邮箱里检查验证邮件。
5. 确认发件人是配置的项目发件人。
6. 确认邮件标题里有 Developer Docs Progress Tracker。
7. 点击邮件里的确认链接。
8. 页面应该跳转到 `/account`。
9. 使用邮箱和密码登录。

## 六、常见问题排查

如果注册时页面显示通用认证错误，优先检查：

- Supabase Dashboard 里的 Auth logs。
- 浏览器 DevTools 的 Network 请求：`auth/v1/signup`。
- Resend 域名是否已经验证完成。
- Supabase SMTP 的 `Username` 是否填了固定值 `resend`。
- Supabase SMTP 的 `Password` 是否是有效的 Resend API Key。
- `Sender email` 是否属于 Resend 已验证域名。
- Redirect URL 是否包含 `/auth/confirm`。

常见原因：

- SMTP 凭证错误。
- 发件邮箱没有在 Resend 验证。
- SMTP username 填错。
- 端口或 TLS 设置不对。
- Resend API Key 失效或已被撤销。
- Supabase Redirect URL 没有配置正确。
