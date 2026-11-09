<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class PhotoboothController extends Controller
{
    /**
     * Display the MIORA Home / Landing page.
     */
    public function home(): View
    {
        $frames = config('miora.frames', []);
        $featuredFrames = array_values(array_filter(
            $frames,
            static fn (array $frame): bool => (bool) ($frame['featured'] ?? false)
        ));

        return view('home', [
            'brand' => config('miora.brand'),
            'featuredFrames' => $featuredFrames,
            'allFrames' => $frames,
            'frameCategories' => config('miora.frame_categories', []),
            'filters' => config('miora.filters', []),
        ]);
    }

    /**
     * Display the interactive Photobooth page.
     */
    public function photobooth(Request $request): View
    {
        return view('photobooth', [
            'brand' => config('miora.brand'),
            'filterCategories' => config('miora.filter_categories', []),
            'filters' => config('miora.filters', []),
            'preselectedFrame' => $request->string('frame', 'classic-cream')->toString(),
            'preselectedMode' => $request->string('mode', 'photostrip')->toString(),
        ]);
    }

    /**
     * Display the Photo Editor & Frame Customization page.
     */
    public function editor(Request $request): View
    {
        return view('editor', [
            'brand' => config('miora.brand'),
            'frameCategories' => config('miora.frame_categories', []),
            'frames' => config('miora.frames', []),
            'layouts' => config('miora.layouts', []),
            'stickers' => config('miora.stickers', []),
            'editorFilters' => config('miora.editor_filters', []),
            'fonts' => config('miora.fonts', []),
            'textColors' => config('miora.text_colors', []),
            'preselectedFrame' => $request->string('frame', '')->toString(),
        ]);
    }

    /**
     * Display the final Result & Download page.
     */
    public function result(): View
    {
        return view('result', [
            'brand' => config('miora.brand'),
            'frames' => config('miora.frames', []),
            'layouts' => config('miora.layouts', []),
            'stickers' => config('miora.stickers', []),
            'editorFilters' => config('miora.editor_filters', []),
            'fonts' => config('miora.fonts', []),
        ]);
    }
}
