<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

class MioraPhotoboothTest extends TestCase
{
    public function test_home_page_displays_brand_identity_and_all_required_sections(): void
    {
        $response = $this->get(route('home'));

        $response->assertOk()
            ->assertSee('MIORA')
            ->assertSee('Little moments,')
            ->assertSee('forever yours.')
            ->assertSee('Start Photobooth')
            ->assertSee('Start Creating')
            ->assertSee('Live Camera Filters')
            ->assertSee('Creative Photo Effects')
            ->assertSee('Custom Photostrips')
            ->assertSee('Personalized Frames')
            ->assertSee('Easy Photo Downloads')
            ->assertSee('How It Works')
            ->assertSee('Choose Your Style')
            ->assertSee('Capture Your Moments')
            ->assertSee('Download Your Memories')
            ->assertSee('About MIORA')
            ->assertSee('Maya Dwi Putri Ramadhani')
            ->assertSee('@vvygyy')
            ->assertDontSee('PT Madtive Studio Indonesia');
    }

    public function test_photobooth_page_renders_camera_controls_filters_and_capture_modes(): void
    {
        $response = $this->get(route('photobooth', ['frame' => 'pastel-blush']));

        $response->assertOk()
            ->assertSee('Allow camera access to start taking photos')
            ->assertSee('Single Photo')
            ->assertSee('Photostrip')
            ->assertSee('2 Photos')
            ->assertSee('3 Photos')
            ->assertSee('4 Photos')
            ->assertSee('3s')
            ->assertSee('5s')
            ->assertSee('10s')
            ->assertSee('Clear Lens: ON')
            ->assertSee('Studio Glow')
            ->assertSee('In Love')
            ->assertSee('Original')
            ->assertSee('Grayscale')
            ->assertSee('Sepia')
            ->assertSee('Soft Pink')
            ->assertSee('Vintage 70s')
            ->assertSee('VHS Tape')
            ->assertSee('Film Grain')
            ->assertSee('Continue to Photo Editor')
            ->assertSee('data-preselected-frame="pastel-blush"', false);
    }

    public function test_photo_editor_page_renders_frames_layouts_and_customization_controls(): void
    {
        $response = $this->get(route('editor'));

        $response->assertOk()
            ->assertSee('Customize Your Photostrip')
            ->assertSee('Miora Signature Cream')
            ->assertSee('Coquette Ribbon')
            ->assertSee('Kodak 35mm Sprocket')
            ->assertSee('Single Photo')
            ->assertSee('2-Photo Layout')
            ->assertSee('3-Photo Strip')
            ->assertSee('4-Photo Strip')
            ->assertSee('Grid Collage')
            ->assertSee('Brightness')
            ->assertSee('Contrast')
            ->assertSee('Add Cute Stickers')
            ->assertSee('Custom Strip Caption')
            ->assertSee('Show Date Stamp')
            ->assertSee('Undo')
            ->assertSee('Reset Editing')
            ->assertSee('Continue to Result');
    }

    public function test_result_page_renders_both_photostrip_and_individual_photo_download_sections(): void
    {
        $response = $this->get(route('result'));

        $response->assertOk()
            ->assertSee('Your photos are ready!')
            ->assertSee('Choose how you want to save your memories.')
            ->assertSee('Framed Photostrip')
            ->assertSee('Download Photostrip (PNG)')
            ->assertSee('Download Animated Photostrip (GIF)')
            ->assertSee('Download (JPG)')
            ->assertSee('Individual Photos')
            ->assertSee('Download All (PNG)')
            ->assertSee('All (GIF)')
            ->assertSee('Animated (GIF)')
            ->assertSee('Edit Again')
            ->assertSee('Retake')
            ->assertSee('Create Another');
    }
}
