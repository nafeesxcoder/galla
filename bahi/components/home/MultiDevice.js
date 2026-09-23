import Reveal from "@/components/Reveal";
import { SyncArt } from "./Illustrations";

export default function MultiDevice() {
  return (
    <section className="section section--wash">
      <div className="wrap artsplit artsplit--flip">
        <Reveal className="artsplit__art">
          <SyncArt />
        </Reveal>

        <Reveal delay={120}>
          <span className="eyebrow">One account, every device</span>
          <h2>Bill on the counter, check reports from anywhere</h2>
          <p className="lead">
            Cloud sync keeps your phone and your computer showing the same
            numbers, whether you are at a supplier&apos;s godown or away on a
            holiday.
          </p>
          <div className="ministats">
            <div>
              <b>99.9%</b>
              <span>Uptime</span>
            </div>
            <div>
              <b>Instant</b>
              <span>Cloud sync</span>
            </div>
          </div>
          <ul className="checklist">
            <li>Unlimited devices on the Gold plan</li>
            <li>Every change visible to your staff at once</li>
            <li>Restore your data on a new phone in minutes</li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
