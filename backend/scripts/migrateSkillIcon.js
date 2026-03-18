/* This file was created to update the skill records in the skill table such that with each skill, a Material Community Icon name will be stored in the backend instead of the url
of the uploaded image to the avatars bucket. This is better to allow the user to pick from a range of pre-built icons when creating their own skill, rather than uploading improper
icons from their gallery, which will cause sizing problems.

*/

const supabase = require("../src/config/database");

const skillIconMap = {
  Music: "music",
  "Ethical Hacking": "robber",
  Java: "java",
  JavaScript: "logo-javascript",
  "Public Speaking": "campaign",
  Python: "python",
  PowerPoint: "presentation",
  Excel: "microsoft-excel",
  Photography: "camera",
  Cooking: "chef-hat",
  Dancing: "dance-ballroom",
};

async function migrateSkillIcons() {
  console.log("🔄 Starting skill icon migration...\n");

  try {
    // Get all skills from database
    const { data: skills, error: fetchError } = await supabase
      .from("skills")
      .select("id, name, icon_url");

    if (fetchError) {
      throw new Error(`Failed to fetch skills: ${fetchError.message}`);
    }

    console.log(`📊 Found ${skills.length} skills to migrate\n`);

    let updatedCount = 0;
    let notFoundCount = 0;
    const notFoundSkills = [];

    // Update each skill
    for (const skill of skills) {
      const iconName = skillIconMap[skill.name];

      if (iconName) {
        // Update skill with icon name
        const { error: updateError } = await supabase
          .from("skills")
          .update({ icon_url: iconName })
          .eq("id", skill.id);

        if (updateError) {
          console.error(
            `❌ Failed to update ${skill.name}:`,
            updateError.message,
          );
        } else {
          console.log(`✅ Updated: ${skill.name} → ${iconName}`);
          updatedCount++;
        }
      } else {
        console.log(`⚠️  No icon mapping for: ${skill.name}`);
        notFoundSkills.push(skill.name);
        notFoundCount++;
      }
    }

    console.log("\n📈 Migration Summary:");
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⚠️  Not found: ${notFoundCount}`);

    if (notFoundSkills.length > 0) {
      console.log("\n📝 Skills without icon mapping:");
      notFoundSkills.forEach((name) => console.log(`   - ${name}`));
      console.log("\n💡 Please add these to skillIconMap and run again.");
    }

    console.log("\n✨ Migration complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

// Run migration
migrateSkillIcons();
