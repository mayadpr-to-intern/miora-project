@props([
    'title' => 'MIORA — Digital Photobooth | Little moments, forever yours.',
    'activePage' => 'home',
    'step' => null,
])

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="MIORA is an aesthetic digital photobooth website where you can capture photos with live webcam effects, customize frames, and download photostrips.">
    <title>{{ $title }}</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='18' fill='%23FAF7F2' stroke='%238C6D58' stroke-width='4'/><circle cx='32' cy='32' r='13' fill='%23F2B8C6' stroke='%232B2625' stroke-width='3'/><circle cx='46' cy='18' r='4' fill='%23A7C7E7'/></svg>">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen flex flex-col bg-miora-cream text-miora-charcoal antialiased selection:bg-miora-blush selection:text-miora-charcoal" data-page="{{ $activePage }}">
    <x-navbar :active-page="$activePage" />

    @if ($step)
        <x-step-indicator :current-step="$step" />
    @endif

    <main class="grow">
        {{ $slot }}
    </main>

    <x-footer />
</body>
</html>
