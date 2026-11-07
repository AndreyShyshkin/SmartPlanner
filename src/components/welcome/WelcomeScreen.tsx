'use client'

import { usePlannerStore } from '@/store/usePlannerStore'
import { ArrowRight, FileCode, PlusCircle, Upload } from 'lucide-react'
import React, { useRef } from 'react'

interface WelcomeScreenProps {
	onEnterPlanner: () => void
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnterPlanner }) => {
	const { loadTemplate, loadProjectJSON } = usePlannerStore()
	const fileInputRef = useRef<HTMLInputElement | null>(null)

	const handleStartPreset = (preset: 'apartment' | 'studio' | 'empty') => {
		loadTemplate(preset)
		onEnterPlanner()
	}

	const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		const reader = new FileReader()
		reader.onload = event => {
			const content = event.target?.result as string
			const success = loadProjectJSON(content)
			if (success) {
				onEnterPlanner()
			} else {
				alert('Не вдалося завантажити файл проєкту JSON. Перевірте формат файлу.')
			}
		}
		reader.readAsText(file)
		e.target.value = ''
	}

	return (
		<div className='relative min-h-screen w-full bg-[#F5F5F7] text-zinc-900 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 select-none overflow-y-auto'>
			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				type='file'
				accept='.json'
				onChange={handleImportFile}
				className='hidden'
			/>

			{/* Decorative background glow */}
			<div className='absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-blue-400/15 to-transparent blur-3xl pointer-events-none' />

			{/* Main Container */}
			<div className='relative max-w-5xl mx-auto px-6 pt-16 pb-12 flex-1 flex flex-col justify-center'>
				{/* Brand Hero */}
				<div className='text-center max-w-2xl mx-auto space-y-4'>
					<h1 className='text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-950'>
						Проєктуйте оселю. <br />
						<span className='text-transparent bg-clip-text bg-gradient-to-r from-[#0071E3] via-blue-600 to-indigo-600'>
							Керуйте в реальному часі.
						</span>
					</h1>

					<p className='text-sm sm:text-base text-zinc-500 leading-relaxed max-w-xl mx-auto'>
						Інтерактивний планувальник із матричною сіткою кімнат, розумними пристроями Apple Home,
						сценаріями, IF-THEN автоматизаціями та фізичною симуляцією видимості крізь стіни.
					</p>
				</div>

				{/* Primary Action Cards: Create New or Load Existing */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-3xl mx-auto w-full'>
					{/* Card 1: Create New Plan */}
					<div className='bg-white/90 backdrop-blur-xl border border-black/10 rounded-3xl p-6 shadow-apple hover:shadow-apple-hover transition-all flex flex-col justify-between group'>
						<div>
							<div className='w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0071E3] mb-4 group-hover:scale-105 transition-transform'>
								<PlusCircle className='w-6 h-6 stroke-[2.2]' />
							</div>

							<h2 className='text-xl font-bold text-zinc-900'>Створити новий план</h2>
							<p className='text-xs text-zinc-500 mt-1 leading-relaxed'>
								Почніть із готового смарт-шаблону з датчиками та правилами, або спроєктуйте
								планування з чистого аркуша.
							</p>
						</div>

						{/* Template options */}
						<div className='mt-6 space-y-2.5'>
							<button
								onClick={() => handleStartPreset('apartment')}
								className='w-full p-3 bg-zinc-50 hover:bg-blue-50/70 border border-black/5 hover:border-blue-200 rounded-2xl text-left transition-all flex items-center justify-between group/btn'
							>
								<div>
									<span className='text-xs font-bold text-zinc-900 block group-hover/btn:text-[#0071E3] transition-colors'>
										2-Кімнатна квартира (Рекомендовано)
									</span>
									<span className='text-[11px] text-zinc-400'>
										Вітальня, спальня, кухня, передпокій, датчики, світло, сценарії
									</span>
								</div>
								<ArrowRight className='w-4 h-4 text-zinc-400 group-hover/btn:text-[#0071E3] group-hover/btn:translate-x-1 transition-all' />
							</button>

							<button
								onClick={() => handleStartPreset('empty')}
								className='w-full p-3 bg-zinc-50 hover:bg-zinc-100 border border-black/5 rounded-2xl text-left transition-all flex items-center justify-between group/btn'
							>
								<div>
									<span className='text-xs font-bold text-zinc-900 block'>Чисте полотно</span>
									<span className='text-[11px] text-zinc-400'>
										Порожня матрична сітка для вільного креслення
									</span>
								</div>
								<ArrowRight className='w-4 h-4 text-zinc-400 group-hover/btn:translate-x-1 transition-all' />
							</button>
						</div>
					</div>

					{/* Card 2: Load Existing Plan */}
					<div
						onClick={() => fileInputRef.current?.click()}
						className='bg-white/90 backdrop-blur-xl border-2 border-dashed border-black/15 hover:border-[#0071E3] rounded-3xl p-6 shadow-apple hover:shadow-apple-hover transition-all flex flex-col justify-between cursor-pointer group'
					>
						<div>
							<div className='w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-105 transition-transform'>
								<Upload className='w-6 h-6 stroke-[2.2]' />
							</div>

							<h2 className='text-xl font-bold text-zinc-900'>Завантажити наявний план</h2>
							<p className='text-xs text-zinc-500 mt-1 leading-relaxed'>
								Імпортуйте збережений проєкт із файлу{' '}
								<code className='text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded font-mono'>
									.json
								</code>{' '}
								з усіма кімнатами, стінами, пристроями та автоматизаціями.
							</p>
						</div>

						<div className='mt-8 p-6 bg-zinc-50 rounded-2xl border border-black/5 text-center group-hover:bg-blue-50/40 transition-colors'>
							<FileCode className='w-8 h-8 text-zinc-400 mx-auto mb-2 group-hover:text-[#0071E3] transition-colors' />
							<span className='text-xs font-semibold text-zinc-700 block'>
								Натисніть для вибору файлу JSON
							</span>
							<span className='text-[11px] text-zinc-400 mt-0.5 block'>
								або перетягніть файл сюди
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
