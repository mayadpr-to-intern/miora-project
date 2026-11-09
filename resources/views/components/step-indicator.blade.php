@props([
    'currentStep' => 1,
])

@php
    $steps = [
        1 => ['label' => 'Capture Moments', 'route' => route('photobooth'), 'sub' => 'Live Camera & Effects'],
        2 => ['label' => 'Customize Strip', 'route' => route('editor'), 'sub' => 'Frames, Stickers & Layout'],
        3 => ['label' => 'Save Memories', 'route' => route('result'), 'sub' => 'Photostrip & Individual ZIP'],
    ];
@endphp

<div {{ $attributes->merge(['class' => 'bg-miora-ivory/80 border-b border-miora-oat/70 py-3 px-4']) }}>
    <div class="max-w-4xl mx-auto flex items-center justify-between sm:justify-center gap-2 sm:gap-8">
        @foreach ($steps as $number => $step)
            @php
                $isActive = (int) $currentStep === $number;
                $isCompleted = (int) $currentStep > $number;
            @endphp
            <a href="{{ $step['route'] }}"
               class="flex items-center gap-2.5 group {{ $isActive ? 'text-miora-charcoal font-semibold' : ($isCompleted ? 'text-miora-brown' : 'text-miora-muted/70') }}">
                <span class="w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all
                    {{ $isActive ? 'bg-miora-charcoal text-miora-ivory ring-4 ring-miora-blush/50' : ($isCompleted ? 'bg-miora-blush text-miora-charcoal' : 'bg-miora-sand text-miora-muted border border-miora-oat') }}">
                    @if ($isCompleted)
                        <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                        </svg>
                    @else
                        {{ $number }}
                    @endif
                </span>
                <div class="flex flex-col">
                    <span class="text-xs sm:text-sm leading-tight group-hover:underline">{{ $step['label'] }}</span>
                    <span class="text-[10px] text-miora-muted hidden md:inline">{{ $step['sub'] }}</span>
                </div>
            </a>

            @if (! $loop->last)
                <div class="w-6 sm:w-14 h-px {{ $isCompleted ? 'bg-miora-brown' : 'bg-miora-oat' }}"></div>
            @endif
        @endforeach
    </div>
</div>
