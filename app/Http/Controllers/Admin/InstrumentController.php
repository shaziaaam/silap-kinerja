<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Instrument;
use App\Models\InstrumentParameter;
use App\Models\ParameterOption;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class InstrumentController extends Controller
{
    public function index()
    {
        $instruments = Instrument::with(['parameters' => function ($q) {
            $q->orderBy('urutan');
        }])->orderBy('urutan_form')->get();

        $settings = [
            'jam_mulai'       => (int) Setting::get('jam_mulai', 7),
            'jam_selesai'     => (int) Setting::get('jam_selesai', 22),
            'hujan_slot_awal' => (int) Setting::get('hujan_slot_awal', 7),
        ];

        // Dropdown parameters (Keadaan Tanah, Keadaan Hujan, ...) and their choices
        $parameterPilihan = InstrumentParameter::where('tipe_input', 'select')
            ->orderBy('kartu')->orderBy('urutan')->get(['id', 'kode', 'label']);
        $pilihan = ParameterOption::orderBy('urutan')->orderBy('id')->get()->groupBy('parameter_kode');

        return Inertia::render('Admin/Instruments', [
            'instruments'      => $instruments,
            'settings'         => $settings,
            'parameterPilihan' => $parameterPilihan,
            'pilihan'          => $pilihan,
        ]);
    }

    public function storeInstrument(Request $request)
    {
        $validated = $request->validate([
            'nama'       => 'required|string|max:255|unique:instruments,nama',
            'kategori'   => 'required|in:aws,taman_alat',
            'is_active'  => 'boolean',
            'urutan_form'=> 'integer|min:0',
        ]);

        Instrument::create($validated);

        return redirect()->back()->with('message', 'Alat berhasil ditambahkan.');
    }

    public function updateInstrument(Request $request, Instrument $instrument)
    {
        $validated = $request->validate([
            'nama'        => ['required', 'string', 'max:255', Rule::unique('instruments', 'nama')->ignore($instrument->id)],
            'kategori'    => 'required|in:aws,taman_alat',
            'is_active'   => 'boolean',
            'urutan_form' => 'integer|min:0',
        ]);

        $instrument->update($validated);

        return redirect()->back()->with('message', "Alat \"{$instrument->nama}\" berhasil diperbarui.");
    }

    public function destroyInstrument(Instrument $instrument)
    {
        $instrument->delete();
        return redirect()->back()->with('message', "Alat \"{$instrument->nama}\" berhasil dihapus.");
    }

    public function storeParameter(Request $request, Instrument $instrument)
    {
        $validated = $request->validate([
            'kode'            => 'required|string|max:100|unique:instrument_parameters,kode',
            'label'           => 'required|string|max:255',
            'satuan'          => 'nullable|string|max:50',
            'tipe_input'      => 'required|in:number,select,text,multicheck,integer',
            'batas_min'       => 'nullable|numeric',
            'batas_max'       => 'nullable|numeric',
            'sumber'          => 'required|in:aws,manual,keduanya',
            'jadwal_baca'     => 'nullable|array',
            'jadwal_baca.*'   => 'string|in:AGM1B,JAM_PENUH,HARIAN_0700',
            'urutan'          => 'integer|min:0',
            'faktor_konversi' => 'nullable|numeric',
            'is_active'       => 'boolean',
            'kartu'           => 'nullable|integer|min:1|max:8',
            'sifat'           => 'nullable|in:input,sebelum,dihitung_app,dihitung_nasional',
            'kode_aws'        => 'nullable|string|max:50',
            'koefisien'       => 'nullable|numeric',
            'opsional'        => 'boolean',
        ]);

        $instrument->parameters()->create($validated);

        return redirect()->back()->with('message', 'Parameter berhasil ditambahkan.');
    }

    public function updateParameter(Request $request, InstrumentParameter $parameter)
    {
        $validated = $request->validate([
            'kode'            => ['required', 'string', 'max:100', Rule::unique('instrument_parameters', 'kode')->ignore($parameter->id)],
            'label'           => 'required|string|max:255',
            'satuan'          => 'nullable|string|max:50',
            'tipe_input'      => 'required|in:number,select,text,multicheck,integer',
            'batas_min'       => 'nullable|numeric',
            'batas_max'       => 'nullable|numeric',
            'sumber'          => 'required|in:aws,manual,keduanya',
            'jadwal_baca'     => 'nullable|array',
            'jadwal_baca.*'   => 'string|in:AGM1B,JAM_PENUH,HARIAN_0700',
            'urutan'          => 'integer|min:0',
            'faktor_konversi' => 'nullable|numeric',
            'is_active'       => 'boolean',
            'kartu'           => 'nullable|integer|min:1|max:8',
            'sifat'           => 'nullable|in:input,sebelum,dihitung_app,dihitung_nasional',
            'kode_aws'        => 'nullable|string|max:50',
            'koefisien'       => 'nullable|numeric',
            'opsional'        => 'boolean',
        ]);

        $parameter->update($validated);

        return redirect()->back()->with('message', "Parameter \"{$parameter->label}\" berhasil diperbarui.");
    }

    public function destroyParameter(InstrumentParameter $parameter)
    {
        $label = $parameter->label;
        $parameter->delete();
        return redirect()->back()->with('message', "Parameter \"{$label}\" berhasil dihapus.");
    }

    /**
     * Kelola Alat > Pilihan: choices of the dropdown fields, copied by the admin from
     * the national system's dropdowns (catatan revisi 2.1, "Dropdown").
     */
    public function storeOption(Request $request)
    {
        $validated = $request->validate([
            'parameter_kode' => ['required', Rule::exists('instrument_parameters', 'kode')->where('tipe_input', 'select')],
            'nilai' => [
                'required', 'string', 'max:100',
                Rule::unique('parameter_options', 'nilai')->where('parameter_kode', $request->input('parameter_kode')),
            ],
            'urutan' => 'nullable|integer|min:0',
        ], [
            'nilai.required' => 'Isi pilihan wajib diisi.',
            'nilai.unique' => 'Pilihan ini sudah ada.',
        ]);

        ParameterOption::create([
            'parameter_kode' => $validated['parameter_kode'],
            'nilai' => trim($validated['nilai']),
            'label' => trim($validated['nilai']),
            'urutan' => $validated['urutan']
                ?? (int) ParameterOption::where('parameter_kode', $validated['parameter_kode'])->max('urutan') + 1,
        ]);

        return redirect()->back()->with('message', 'Pilihan berhasil ditambahkan.');
    }

    public function updateOption(Request $request, ParameterOption $option)
    {
        $validated = $request->validate([
            'nilai' => [
                'required', 'string', 'max:100',
                Rule::unique('parameter_options', 'nilai')->where('parameter_kode', $option->parameter_kode)->ignore($option->id),
            ],
            'urutan' => 'required|integer|min:0',
        ], [
            'nilai.required' => 'Isi pilihan wajib diisi.',
            'nilai.unique' => 'Pilihan ini sudah ada.',
        ]);

        // Stored observations keep the text they were saved with.
        $option->update(['nilai' => trim($validated['nilai']), 'label' => trim($validated['nilai']), 'urutan' => $validated['urutan']]);

        return redirect()->back()->with('message', 'Pilihan berhasil diperbarui.');
    }

    public function destroyOption(ParameterOption $option)
    {
        $option->delete();

        return redirect()->back()->with('message', "Pilihan \"{$option->nilai}\" dihapus. Data observasi lama yang memakainya tidak berubah.");
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'jam_mulai'       => 'required|integer|min:0|max:23',
            'jam_selesai'     => 'required|integer|min:0|max:23|gte:jam_mulai',
            'hujan_slot_awal' => 'required|integer|min:0|max:23',
        ]);

        Setting::set('jam_mulai', $validated['jam_mulai']);
        Setting::set('jam_selesai', $validated['jam_selesai']);
        Setting::set('hujan_slot_awal', $validated['hujan_slot_awal']);

        return redirect()->back()->with('message', 'Pengaturan berhasil disimpan.');
    }
}
