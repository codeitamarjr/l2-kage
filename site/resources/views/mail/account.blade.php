<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;padding:0;background:#16110e;font-family:Georgia,'Times New Roman',serif;color:#ece3d3;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#16110e;padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#1e1814;border:1px solid #5a4a2e;">
                    <tr>
                        <td style="padding:28px 32px 8px;text-align:center;">
                            <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#a8905f;">{{ config('l2j.server_name') }} · Lineage II Essence</div>
                            <h1 style="margin:12px 0 0;font-size:24px;font-weight:normal;color:#e8c77a;">{{ $title }}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 32px 8px;font-size:16px;line-height:1.6;">
                            @foreach ($lines as $line)
                                <p style="margin:0 0 14px;">{{ $line }}</p>
                            @endforeach
                        </td>
                    </tr>
                    @foreach ($actions as $action)
                        <tr>
                            <td align="center" style="padding:4px 32px 14px;">
                                <a href="{{ $action['url'] }}" style="display:inline-block;padding:12px 26px;background:#d4a94e;color:#1a1410;text-decoration:none;font-size:14px;letter-spacing:2px;text-transform:uppercase;">{{ $action['label'] }}</a>
                            </td>
                        </tr>
                    @endforeach
                    <tr>
                        <td style="padding:8px 32px 28px;font-size:13px;line-height:1.6;color:#a39886;">
                            @foreach ($footer as $line)
                                <p style="margin:0 0 10px;">{{ $line }}</p>
                            @endforeach
                            <p style="margin:0;">If the button doesn't work, copy this link into your browser:<br>
                                @foreach ($actions as $action)
                                    <span style="word-break:break-all;color:#c9b48a;">{{ $action['url'] }}</span><br>
                                @endforeach
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
