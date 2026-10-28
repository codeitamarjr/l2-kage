{{ $title }}

@foreach ($lines as $line)
{{ $line }}

@endforeach
@foreach ($actions as $action)
{{ $action['label'] }}: {{ $action['url'] }}
@endforeach

@foreach ($footer as $line)
{{ $line }}

@endforeach
— {{ config('l2j.server_name') }}
