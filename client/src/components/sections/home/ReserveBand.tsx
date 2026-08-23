import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Picture } from '@/components/media/Picture';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { Parallax } from '@/components/motion/Parallax';
import { DEPTH } from '@/motion/constants';
import { toISO, addDays } from '@/lib/format';
import { img } from '@/data/brand';

/**
 * A conversion shortcut, not a duplicate flow — submitting routes into the
 * real reservation flow with the first two steps already completed.
 */
export function ReserveBand() {
  const navigate = useNavigate();
  const today = new Date();
  const [date, setDate] = useState(toISO(addDays(today, 1)));
  const [party, setParty] = useState('2');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/reserve?date=${date}&party=${party}&step=2`);
  };

  return (
    <section id="reserve" className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Parallax rate={DEPTH.near} className="h-full">
          <Picture
            src={img('1414235077428-338989a2e8c0')}
            alt=""
            className="h-[112%] w-full"
            sizes="100vw"
          />
        </Parallax>
        <div className="u-scrim-full" />
      </div>

      <div className="relative z-10 py-24 lg:py-36">
        <div className="u-shell">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-16">
            <div className="lg:col-span-6">
              <Reveal>
                <p className="u-mono mb-6" style={{ color: 'var(--color-bone-faint)' }}>
                  Reservations
                </p>
              </Reveal>
              <LineMask
                text="A table by the fire"
                as="h2"
                className="u-display mb-6"
                margin="0px 0px -20% 0px"
              />
              <Reveal delay={0.1}>
                <p style={{ color: 'var(--color-bone-dim)', maxWidth: '40ch' }}>
                  Ninety days ahead, and up to eight guests online. Larger parties are handled by
                  the private dining team.
                </p>
              </Reveal>
            </div>

            <form onSubmit={submit} className="lg:col-span-6">
              <Reveal delay={0.15}>
                <div
                  className="grid gap-6 border p-7 sm:grid-cols-2 lg:p-9"
                  style={{
                    borderColor: 'var(--color-smoke)',
                    background: 'rgb(11 11 12 / 0.72)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <div className="field">
                    <label className="field__label" htmlFor="rb-date">
                      Date
                    </label>
                    <input
                      id="rb-date"
                      type="date"
                      className="field__control"
                      value={date}
                      min={toISO(today)}
                      max={toISO(addDays(today, 90))}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="field__label" htmlFor="rb-party">
                      Guests
                    </label>
                    <select
                      id="rb-party"
                      className="field__control"
                      value={party}
                      onChange={(e) => setParty(e.target.value)}
                    >
                      {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n} style={{ background: 'var(--color-ash)' }}>
                          {n} {n === 1 ? 'guest' : 'guests'}
                        </option>
                      ))}
                      <option value="9" style={{ background: 'var(--color-ash)' }}>
                        9 or more
                      </option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <button type="submit" className="btn btn--filled w-full">
                      <span>Check availability</span>
                    </button>
                  </div>
                </div>
              </Reveal>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
